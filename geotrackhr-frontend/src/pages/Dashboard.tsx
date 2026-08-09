import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, CalendarClock, BarChart3, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { fetchMe } from '@/services/employee';

const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [meId, setMeId] = useState<string | null>(null);
  const isEmployee = user?.role === 'employee';

  useEffect(() => {
    if (!isEmployee) return;
    fetchMe()
      .then((me) => setMeId(me?.id ?? null))
      .catch(() => setMeId(null));
  }, [isEmployee]);

  return (
    <div>
      <h1>Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
      <p className="mt-1 text-sm text-ink-500">
        {isEmployee
          ? 'Punch in with your live location and a selfie, request leave, or review your attendance.'
          : "Here's what's happening across your sites today."}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Take live attendance — GPS + selfie */}
        <Card>
          <div className="flex h-full flex-col">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <Camera size={22} />
            </div>
            <h3 className="text-base font-semibold text-ink-900">Live Attendance</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">
              {isEmployee
                ? 'Punch in / out with your device location and a live selfie.'
                : 'Check-ins, check-outs, and pending approvals across all sites.'}
            </p>
            <Link to={isEmployee ? '/attendance/live' : '/attendance'} className="mt-4 block">
              <Button variant="primary" className="w-full">
                {isEmployee ? 'Take attendance' : 'Open attendance'}
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>

        {/* 2. Leave requests */}
        <Card>
          <div className="flex h-full flex-col">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-info-100 text-info-700">
              <CalendarClock size={22} />
            </div>
            <h3 className="text-base font-semibold text-ink-900">Leave Requests</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">
              {isEmployee
                ? 'Request time off and track your approvals.'
                : 'Review and act on pending supervisor/HR leave approvals.'}
            </p>
            <Link to={isEmployee ? (meId ? `/leaves/employee/${meId}` : '/leaves') : '/leaves'} className="mt-4 block">
              <Button variant="secondary" className="w-full">
                {isEmployee ? 'My leave' : 'Open leave'}
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>

        {/* 3. Reports */}
        <Card>
          <div className="flex h-full flex-col">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-success-100 text-success-700">
              <BarChart3 size={22} />
            </div>
            <h3 className="text-base font-semibold text-ink-900">Reports</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">
              {isEmployee
                ? 'View your attendance history and leave balance.'
                : 'Daily, site, and monthly payroll attendance summaries.'}
            </p>
            <Link
              to={isEmployee ? (meId ? `/attendance/employee/${meId}` : '/attendance/employee') : '/reports'}
              className="mt-4 block"
            >
              <Button variant="secondary" className="w-full">
                {isEmployee ? 'My reports' : 'Open reports'}
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
