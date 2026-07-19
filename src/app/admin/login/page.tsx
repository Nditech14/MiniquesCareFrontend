'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { saveTokens, saveAdmin } from '@/lib/auth';
import type { ApiResponse, LoginResponse } from '@/types';
import { Cross, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = (await authApi.login(email, password)) as ApiResponse<LoginResponse>;
      if (res.success) {
        saveTokens(res.data.accessToken, res.data.refreshToken);
        saveAdmin(res.data.admin);
        router.push('/admin');
      } else {
        setError(res.message || 'Invalid credentials.');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4" style={{ background: '#25D366' }}>
            <Cross className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">MiniquesCare</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@miniquescare.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#25D366' } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#25D366' } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#25D366' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
