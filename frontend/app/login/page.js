'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { password, role });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Aftaar Manager</h1>
          <p className="text-gray-500 mt-2">Expense Tracking System</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Access Level</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                    role === 'admin'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                    role === 'user'
                      ? 'border-secondary bg-secondary text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Viewer
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input input-bordered w-full bg-base-100"
                required
              />
            </div>

            {error && (
              <div className="alert alert-error py-2 text-sm">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`btn w-full ${role === 'admin' ? 'btn-primary' : 'bg-secondary hover:bg-secondary/90 text-white border-0'}`}
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Admin can manage data. Viewer has read-only access.
        </p>
      </div>
    </div>
  );
}
