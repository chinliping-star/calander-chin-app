import { useApi } from '../../../lib/api.ts';

export interface ApiFriendUser {
  _id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export interface ApiFriend {
  friendship_id: string;
  friend: ApiFriendUser;
  since: string;
}

export interface ApiMutualFriends {
  total: number;
  friends: ApiFriendUser[];
}

export interface ApiRequest {
  _id: string;
  requester_id: ApiFriendUser;
  recipient_id: ApiFriendUser;
  status: string;
  created_at: string;
}

export function useFriendsApi() {
  const api = useApi();

  return {
    getFriends:       ()                         => api.get<ApiFriend[]>('/friends'),
    getMutual:        (userId: string)           => api.get<ApiMutualFriends>(`/friends/mutual/${userId}`),
    getArchived:      ()                         => api.get<ApiFriend[]>('/friends/archived'),
    getRequests:      ()                         => api.get<ApiRequest[]>('/friends/requests'),
    getOutgoing:      ()                         => api.get<{ _id: string; recipient_id: ApiFriendUser }[]>('/friends/outgoing'),
    sendRequest:      (userId: string)           => api.post<unknown>(`/friends/request/${userId}`),
    withdrawRequest:  (recipientId: string)      => api.delete<void>(`/friends/withdraw/${recipientId}`),
    acceptRequest:    (requesterId: string)      => api.patch<unknown>(`/friends/accept/${requesterId}`),
    rejectRequest:    (requesterId: string)      => api.delete<void>(`/friends/reject/${requesterId}`),
    removeFriend:     (friendId: string)         => api.delete<void>(`/friends/${friendId}`),
    searchUsers:      (q: string)                => api.get<ApiFriendUser[]>(`/users/search?q=${encodeURIComponent(q)}`),
  };
}
