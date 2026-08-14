import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarClock, Send } from 'lucide-react';
import {
  fetchEmployeeLeaves,
  submitLeave,
  LeaveRecord,
  LeaveType,
  LEAVE_TYPE_LABELS,
} from '@/services/leave';
import { fetchMe } from '@/services/employee';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Table from '@/components/ui/Table';
import Alert from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/Badge';

const LEAVE_TYPES: LeaveType[] = ['annual', 'sick', 'casual', 'emergency', 'maternity', 'unpaid'];

/** Readable label for each leave status (used for decision feedback) */
const LEAVE_STATUS_LABELS: Record<LeaveRecord['status'], string> = {
  pending: 'Pending HR review',
  approved_by_supervisor: 'Approved by supervisor — awaiting HR',
  approved_by_hr: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const EmployeeLeaves: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  // Self-service mode: when no :employeeId in the URL, resolve the current
  // user's own employee record (used by the employee dashboard).
  const selfService = !employeeId;

  const [meId, setMeId] = useState<string | null>(null);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Request form state ────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leave_type: 'annual' as LeaveType,
    start_date: '',
    end_date: '',
    half_day: false,
    reason: '',
  });

  const targetEmployeeId = employeeId ?? meId;

  const load = useCallback(async () => {
    if (!targetEmployeeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEmployeeLeaves(targetEmployeeId);
      setLeaves(res.data.data ?? []);
    } catch {
      setError('Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  }, [targetEmployeeId]);

  useEffect(() => {
    if (!selfService) {
      load();
      return;
    }
    // Resolve own employee record first, then load history.
    setLoading(true);
    fetchMe()
      .then((me) => setMeId(me?.id ?? null))
      .catch(() => setError('Failed to load your profile.'))
      .finally(() => setLoading(false));
  }, [selfService, load]);

  useEffect(() => {
    if (selfService && meId) load();
  }, [selfService, meId, load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!targetEmployeeId) {
      setFormError('Could not resolve your employee record. Try refreshing.');
      return;
    }
    if (!form.start_date || !form.end_date) {
      setFormError('Pick a start and end date.');
      return;
    }
    if (form.end_date < form.start_date) {
      setFormError('End date must be on or after the start date.');
      return;
    }
    setSubmitting(true);
    try {
      await submitLeave({
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        half_day: form.half_day,
        reason: form.reason.trim() || undefined,
      });
      setForm({ leave_type: 'annual', start_date: '', end_date: '', half_day: false, reason: '' });
      setFormOpen(false);
      await load();
    } catch (err: any) {
      setFormError(err?.response?.data?.error?.message ?? 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
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
    {
      header: 'HR comment',
      accessor: 'hr_comment' as keyof LeaveRecord,
      render: (row: LeaveRecord) =>
        row.hr_comment ?? row.rejection_reason ?? row.supervisor_comment ?? <span className="text-ink-400">—</span>,
    },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>{selfService ? 'My Leave' : 'Leave History'}</h1>
          {selfService && (
            <p className="mt-1 text-sm text-ink-500">
              Request time off — HR reviews it and you'll see the decision here.
            </p>
          )}
        </div>
        {selfService && (
          <Button onClick={() => setFormOpen((o) => !o)}>
            <CalendarClock size={16} />
            {formOpen ? 'Close form' : 'Request leave'}
          </Button>
        )}
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {selfService && formOpen && (
        <Card className="mb-5">
          <h3 className="mb-1 text-base font-semibold text-ink-900">New leave request</h3>
          <p className="mb-4 text-sm text-ink-500">This request goes to HR for review.</p>
          {formError && <Alert tone="danger" className="mb-4">{formError}</Alert>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Leave type"
              value={form.leave_type}
              onChange={(e) => setForm((f) => ({ ...f, leave_type: e.target.value as LeaveType }))}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LEAVE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 pb-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={form.half_day}
                  onChange={(e) => setForm((f) => ({ ...f, half_day: e.target.checked }))}
                  className="h-4 w-4 rounded border-ink-300"
                />
                Half day
              </label>
            </div>
            <div>
              <label htmlFor="start-date" className="mb-1 block text-sm font-medium text-ink-700">
                Start date
              </label>
              <input
                id="start-date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="focus-ring w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="mb-1 block text-sm font-medium text-ink-700">
                End date
              </label>
              <input
                id="end-date"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="focus-ring w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900"
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Reason"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                rows={3}
                placeholder="Why are you requesting this leave?"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                <Send size={15} />
                Submit request
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={selfService ? 'My requests' : 'All requests'}>
        <Table<LeaveRecord>
          columns={columns}
          data={leaves}
          loading={loading}
          emptyTitle="No leave requests"
          emptyDescription={
            selfService ? 'Request your first leave above — HR decisions show up here.' : undefined
          }
        />
      </Card>

      {/* Decision feedback: latest decision highlighted for the employee */}
      {selfService && !loading && leaves.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">Latest decision</h2>
          {(() => {
            const latest = leaves[0];
            const approved = latest.status === 'approved_by_hr';
            const rejected = latest.status === 'rejected';
            const label = LEAVE_STATUS_LABELS[latest.status];
            const detail = latest.hr_comment ?? latest.rejection_reason ?? latest.supervisor_comment;
            return (
              <div
                className={`rounded-md border px-4 py-3 text-sm ${
                  approved
                    ? 'border-success-200 bg-success-50 text-success-800'
                    : rejected
                      ? 'border-primary-200 bg-primary-50 text-primary-800'
                      : 'border-ink-200 bg-ink-50 text-ink-700'
                }`}
              >
                <p className="font-medium">
                  {LEAVE_TYPE_LABELS[latest.leave_type]} — {latest.start_date} to {latest.end_date}: {label}
                </p>
                {detail && <p className="mt-1">{detail}</p>}
                {rejected && !detail && (
                  <p className="mt-1">No reason given. Contact HR if you'd like more detail.</p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaves;
