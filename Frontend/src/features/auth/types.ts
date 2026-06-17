export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  display_name: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    _id: string;
    username: string;
    email: string;
    display_name: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    banner_url?: string;
    bio?: string;
    theme?: string;
    is_premium?: boolean;
  };
}
