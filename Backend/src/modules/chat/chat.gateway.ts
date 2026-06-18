import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  clerkUserId: string;
  mongoUserId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // clerkUserId → Set of socket ids
  private userSockets = new Map<string, Set<string>>();
  // mongoUserId → Set of socket ids (drives online/offline presence)
  private presence = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) { client.disconnect(); return; }

      const payload = await verifyToken(token, {
        secretKey: this.configService.get<string>('CLERK_SECRET_KEY')!,
      });

      client.clerkUserId = payload.sub;

      // Join personal room so we can send targeted events
      void client.join(`user:${payload.sub}`);

      // Track socket
      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      // Resolve mongo id and track presence
      try {
        const mongoId = (await this.chatService.resolveMongoId(payload.sub)).toString();
        client.mongoUserId = mongoId;

        const wasOffline = !this.presence.has(mongoId) || this.presence.get(mongoId)!.size === 0;
        if (!this.presence.has(mongoId)) this.presence.set(mongoId, new Set());
        this.presence.get(mongoId)!.add(client.id);

        // Send the current online roster to the freshly connected client
        client.emit('presence:state', this.onlineUserIds());

        // Announce this user came online (only on first socket)
        if (wasOffline) {
          this.server.emit('presence:online', { userId: mongoId });
        }
      } catch {
        /* user profile not found — skip presence, keep chat working */
      }

    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.clerkUserId) {
      const sockets = this.userSockets.get(client.clerkUserId);
      sockets?.delete(client.id);
      if (sockets?.size === 0) this.userSockets.delete(client.clerkUserId);
    }

    if (client.mongoUserId) {
      const set = this.presence.get(client.mongoUserId);
      set?.delete(client.id);
      if (set && set.size === 0) {
        this.presence.delete(client.mongoUserId);
        this.server.emit('presence:offline', { userId: client.mongoUserId });
      }
    }
  }

  // Client can ask for the authoritative online roster at any time
  // (on reconnect / window focus / poll) to self-heal missed events.
  @SubscribeMessage('presence:get')
  handlePresenceGet(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('presence:state', this.onlineUserIds());
  }

  private onlineUserIds(): string[] {
    return [...this.presence.entries()]
      .filter(([, sockets]) => sockets.size > 0)
      .map(([userId]) => userId);
  }

  // Join a conversation room so messages broadcast to all participants
  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() convId: string,
  ) {
    void client.join(`conv:${convId}`);
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() convId: string,
  ) {
    void client.leave(`conv:${convId}`);
  }

  // ── Message events ────────────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    try {
      const msg = await this.chatService.sendMessage(
        client.clerkUserId,
        data.conversationId,
        data.content,
      );
      this.server.to(`conv:${data.conversationId}`).emit('message:new', msg);
    } catch (e: unknown) {
      client.emit('error', { message: (e as Error).message });
    }
  }

  @SubscribeMessage('message:edit')
  async handleEdit(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    try {
      const msg = await this.chatService.editMessage(
        client.clerkUserId,
        data.messageId,
        data.content,
      );
      this.server.to(`conv:${msg.conversation_id.toString()}`).emit('message:edited', msg);
    } catch (e: unknown) {
      client.emit('error', { message: (e as Error).message });
    }
  }

  @SubscribeMessage('message:delete')
  async handleDelete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    try {
      await this.chatService.deleteMessage(client.clerkUserId, data.messageId);
      this.server
        .to(`conv:${data.conversationId}`)
        .emit('message:deleted', { messageId: data.messageId, conversationId: data.conversationId });
    } catch (e: unknown) {
      client.emit('error', { message: (e as Error).message });
    }
  }

  @SubscribeMessage('message:seen')
  async handleSeen(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    try {
      await this.chatService.markSeen(client.clerkUserId, data.conversationId, data.messageId);
      this.server.to(`conv:${data.conversationId}`).emit('message:seen', {
        messageId: data.messageId,
        conversationId: data.conversationId,
        seenBy: client.clerkUserId,
      });
    } catch { /* ignore */ }
  }

  @SubscribeMessage('message:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conv:${data.conversationId}`).emit('message:typing', {
      conversationId: data.conversationId,
      userId: client.clerkUserId,
    });
  }

  // Utility: emit to all sockets of a specific clerk user
  emitToUser(clerkUserId: string, event: string, data: unknown) {
    this.server.to(`user:${clerkUserId}`).emit(event, data);
  }
}
