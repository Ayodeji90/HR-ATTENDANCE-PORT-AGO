import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, XCircle, Hourglass } from 'lucide-react';
import { fetchMe } from '@/services/employee';
import { fetchEmployeeAttendanceHistory, AttendanceRecord, EVENT_TYPE_LABELS } from '@/services/attendance';
import { fetchEmployeeLeaves, LeaveRecord, LEAVE_TYPE_LABELS } from '@/services/leave';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/Badge';

/** Generate the last 12 months as YYYY-MM options (newest first). */
function monthOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return options;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

const MyReports: React.FC = () => {
  const [meId, setMeId] = useState<string | null>(null);
  const [month, setMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setMeId(me?.id ?? null))
      .catch(() => setError('Failed to load your profile.'));
  }, []);

  const load = useCallback(async () => {
    if (!meId) return;
    setLoading(true);
    setError(null);
    try {
      const [att, lv] = await Promise.all([
        fetchEmployeeAttendanceHistory(meId, month),
        fetchEmployeeLeaves(meId, month),
      ]);
      setAttendance(att);
      setLeaves(lv.data?.data ?? []);
    } catch {
      setError('Failed to load your report for this month.');
    } finally {
      setLoading(false);
    }
  }, [meId, month]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const daysPresent = new Set(attendance.map((r) => r.event_date)).size;
    const approvedPunches = attendance.filter((r) => r.status === 'approved').length;
    const pendingPunches = attendance.filter((r) => r.status === 'pending').length;
    const leaveDays = leaves
      .filter((l) => l.status === 'approved_by_hr' || l.status === 'approved_by_supervisor')
      .reduce((sum, l) => sum + Number(l.duration_days), 0);
    return { daysPresent, approvedPunches, pendingPunches, leaveDays, leaveCount: leaves.length };
  }, [attendance, leaves]);

  const attendanceColumns = [
    {
      header: 'Date',
      accessor: 'event_date' as keyof AttendanceRecord,
    },
    {
      header: 'Time',
      accessor: 'event_time' as keyof AttendanceRecord,
    },
    {
      header: 'Type',
      accessor: 'event_type' as keyof AttendanceRecord,
      render: (row: AttendanceRecord) => EVENT_TYPE_LABELS[row.event_type],
    },
    {
      header: 'Status',
      accessor: 'status' as keyof AttendanceRecord,
      render: (row: AttendanceRecord) => <StatusBadge status={row.status} />,
    },
  ];

  const leaveColumns = [
    {
      header: 'Type',
      accessor: 'leave_type' as keyof LeaveRecord,
      render: (row: LeaveRecord) => LEAVE_TYPE_LABELS[row.leave_type],
    },
    { header: 'Start', accessor: 'start_date' as keyof LeaveRecord },
    { header: 'End', accessor: 'end_date' as keyof LeaveRecord },
    { header: 'Days', accessor: 'duration_days' as keyof LeaveRecord },
    {
      header: 'Decision',
      accessor: 'status' as keyof LeaveRecord,
      render: (row: LeaveRecord) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>My Reports</h1>
          <p className="mt-1 text-sm text-ink-500">Your attendance and leave for the selected month.</p>
        </div>
        <div className="w-52">
          <Select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Report month">
            {monthOptions().map((ym) => (
              <option key={ym} value={ym}>
                {monthLabel(ym)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-100 text-info-700">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-ink-900">{summary.daysPresent}</p>
                  <p className="text-xs text-ink-500">Days present</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-700">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-ink-900">{summary.approvedPunches}</p>
                  <p className="text-xs text-ink-500">Approved punches</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-700">
                  <Hourglass size={20} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-ink-900">{summary.pendingPunches}</p>
                  <p className="text-xs text-ink-500">Pending approval</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                  <XCircle size={20} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-ink-900">{summary.leaveDays}</p>
                  <p className="text-xs text-ink-500">Leave days ({summary.leaveCount} requests)</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card title={`Attendance — ${monthLabel(month)}`}>
              <Table<AttendanceRecord>
                columns={attendanceColumns}
                data={attendance}
                loading={loading}
                emptyTitle="No attendance this month"
                emptyDescription="Punches you record this month will appear here."
              />
            </Card>

            <Card title={`Leave — ${monthLabel(month)}`}>
              <Table<LeaveRecord>
                columns={leaveColumns}
                data={leaves}
                loading={loading}
                emptyTitle="No leave this month"
                emptyDescription="Leave you take this month will appear here."
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default MyReports;
