import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { changePassword } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const MyAccount: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current password.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password changed — use your new password on your next login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'INVALID_CURRENT_PASSWORD') {
        setError('Current password is incorrect.');
      } else {
        setError(err?.response?.data?.error?.message ?? 'Failed to change password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-4">My Account</h1>
      <Card title="Account">
        <div className="space-y-1.5 text-sm">
          <p className="text-ink-500">
            Signed in as <span className="font-medium text-ink-800">{user?.fullName ?? user?.email}</span>
          </p>
          <p className="text-ink-500">
            Email: <span className="font-medium text-ink-800">{user?.email}</span>
          </p>
          <p className="text-ink-500">
            Role: <span className="font-medium text-ink-800 capitalize">{user?.role}</span>
          </p>
        </div>
      </Card>

      <Card title="Change password" className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}
          <Input
            label="Current password"
            name="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Input
            label="New password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          <Input
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={submitting}>
              Change password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MyAccount;
