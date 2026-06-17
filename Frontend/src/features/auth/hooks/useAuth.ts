import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.ts';
import { login, register, logout } from '../api/auth.api.ts';
import type { LoginPayload, RegisterPayload } from '../types.ts';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function doLogin(payload: LoginPayload) {
    setLoading(true);
    setError(null);
    try {
      const { user, accessToken } = await login(payload);
      setAuth(user, accessToken);
      navigate(`/${user.username}/calendar`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return { doLogin, loading, error };
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function doRegister(payload: RegisterPayload) {
    setLoading(true);
    setError(null);
    try {
      const { user, accessToken } = await register(payload);
      setAuth(user, accessToken);
      navigate(`/${user.username}/calendar`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return { doRegister, loading, error };
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  async function doLogout() {
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  }

  return { doLogout };
}
