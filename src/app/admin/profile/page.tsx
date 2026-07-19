'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { getToken, saveAdmin } from '@/lib/auth';
import type { Admin, ApiResponse } from '@/types';
import { Field, Input } from '@/components/admin';
import { Spinner } from '@/components/ui';
import { User, Mail, Lock, Camera } from 'lucide-react';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    adminApi
      .getProfile(token)
      .then((res: ApiResponse<Admin>) => {
        if (res.success && res.data) {
          setProfile(res.data);
          setNewEmail(res.data.email);
          saveAdmin(res.data);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const token = getToken();
      if (!token) return;
      const res = (await adminApi.updateEmail(
        { email: newEmail, password: emailPassword },
        token
      )) as ApiResponse<Admin>;
      if (res.success) {
        setMessage('Email updated successfully.');
        setEmailPassword('');
        if (res.data) {
          setProfile(res.data);
          saveAdmin(res.data);
        }
      } else {
        setError(res.message || 'Failed to update email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const token = getToken();
      if (!token) return;
      const res = await adminApi.updatePassword(
        { currentPassword, newPassword },
        token
      );
      if (res.success) {
        setMessage('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.message || 'Failed to update password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const token = getToken();
      if (!token) return;
      const formData = new FormData();
      formData.append('file', file);
      const res = (await adminApi.updateProfileImage(formData, token)) as ApiResponse<Admin>;
      if (res.success && res.data) {
        setProfile(res.data);
        saveAdmin(res.data);
        setMessage('Profile image updated.');
      } else {
        setError(res.message || 'Failed to upload image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your admin account details.</p>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {profile?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profileImageUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: '#25D366' }}
              >
                {profile?.name?.[0]?.toUpperCase() ?? <User className="w-8 h-8" />}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center cursor-pointer hover:bg-gray-700">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{profile?.name}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleEmailUpdate} className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4" style={{ color: '#25D366' }} />
          <h2 className="font-semibold text-gray-900">Update Email</h2>
        </div>
        <Field label="New Email">
          <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" required />
        </Field>
        <Field label="Current Password (to confirm)">
          <Input value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} type="password" required />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="mt-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: '#25D366' }}
        >
          Update Email
        </button>
      </form>

      <form onSubmit={handlePasswordUpdate} className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4" style={{ color: '#25D366' }} />
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <Field label="Current Password">
          <Input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" required />
        </Field>
        <Field label="New Password">
          <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" required />
        </Field>
        <Field label="Confirm New Password">
          <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="mt-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: '#25D366' }}
        >
          Change Password
        </button>
      </form>
    </div>
  );
}
