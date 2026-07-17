import React from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';

const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <h1>Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
      <p className="mt-1 text-sm text-ink-500">Here's what's happening across your sites today.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Live Attendance">
          <p className="text-sm text-ink-500">Check-ins, check-outs, and pending approvals across all sites.</p>
        </Card>
        <Card title="Leave Requests">
          <p className="text-sm text-ink-500">Review and act on pending supervisor/HR leave approvals.</p>
        </Card>
        <Card title="Reports">
          <p className="text-sm text-ink-500">Daily, site, and monthly payroll attendance summaries.</p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
