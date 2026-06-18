import { useApi } from '../../../lib/api.ts';

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ChatLogPayload {
  sessionId: string;
  from: 'user' | 'bot' | 'agent';
  text: string;
  needsAgent?: boolean;
}

export function useSupportApi() {
  const api = useApi();
  return {
    contact: (payload: ContactPayload) => api.post<unknown>('/support/contact', payload),
    logChat: (payload: ChatLogPayload) => api.post<unknown>('/support/chat', payload),
  };
}
