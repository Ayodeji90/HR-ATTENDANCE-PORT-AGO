import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  fetchPendingLeaves,
  supervisorApprove,
  supervisorReject,
  hrApprove,
  hrReject,
  LeaveRecord,
  LeaveStatus,
  LEAVE_TYPE_LABELS,
} from '@/services/leave';
import { useLookupMaps } from '@/hooks/useLookupMaps';
import { useAuthStore } from '@/store/authStore';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { StatusBadge } from '@/components/ui/Badge';

type Stage = 'supervisor' | 'hr';

const LeaveApprovals: React.FC = () => {
  const role = useAuthStore((state) => state.user?.role);
  const stages: Stage[] = role === 'hr' ? ['hr'] : role === 'supervisor' ? ['supervisor'] : ['supervisor', 'hr'];
  const [stage, setStage] = useState<Stage>(stages[0]);

  // Single-stage flow: HR acts directly on fresh requests (pending). The
  // supervisor stage remains available for orgs that use it, but HR no longer
  // has to wait for a supervisor before deciding.
  const statusForStage: Record<Stage, LeaveStatus> = {
    supervisor: 'pending',
    hr: role === 'hr' ? 'pending' : 'approved_by_supervisor',
  };

  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeaveRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { employeeNames } = useLookupMaps();

  const load = () => {
    setLoading(true);
    fetchPendingLeaves(statusForStage[stage])
      .then((res) => setRecords(res.data.data))
      .catch(() => setError('Failed to load leave requests.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [stage]);

  const handleApprove = async (record: LeaveRecord) => {
    setBusyId(record.id);
    try {
      if (stage === 'supervisor') await supervisorApprove(record.id);
      else await hrApprove(record.id);
      load();
    } catch {
      setError('Failed to approve leave request.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setBusyId(rejectTarget.id);
    try {
      if (stage === 'supervisor') await supervisorReject(rejectTarget.id, rejectReason.trim());
      else await hrReject(rejectTarget.id, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch {
      setError('Failed to reject leave request.');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    {
      header: 'Employee',
      accessor: 'employee_id' as keyof LeaveRecord,
      render: (row: LeaveRecord) => employeeNames[row.employee_id] ?? row.employee_id,
    },
    {
      header: 'Type',
      accessor: 'leave_type' as keyof LeaveRecord,
      render: (row: LeaveRecord) => LEAVE_TYPE_LABELS[row.leave_type],
    },
    { header: 'Start', accessor: 'start_date' as keyof LeaveRecord },
    { header: 'End', accessor: 'end_date' as keyof LeaveRecord },
    { header: 'Days', accessor: 'duration_days' as keyof LeaveRecord },
    { header: 'Reason', accessor: 'reason' as keyof LeaveRecord },
    {
      header: 'Status',
      accessor: 'status' as keyof LeaveRecord,
      render: (row: LeaveRecord) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: 'id' as keyof LeaveRecord,
      render: (row: LeaveRecord) => (
        <div className="flex gap-2">
          <Button size="sm" loading={busyId === row.id} onClick={() => handleApprove(row)}>
            <Check size={14} />
            Approve
          </Button>
          <Button size="sm" variant="danger" disabled={busyId === row.id} onClick={() => setRejectTarget(row)}>
            <X size={14} />
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-4">Leave Approvals</h1>

      {stages.length > 1 && (
        <div className="mb-4 flex gap-1 border-b border-ink-100">
          {stages.map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`px-4 py-2 text-sm font-medium ${
                stage === s ? 'border-b-2 border-primary-600 text-primary-700' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              {s === 'supervisor' ? 'Awaiting Supervisor' : 'Pending HR Review'}
            </button>
          ))}
        </div>
      )}

      {error && <Alert className="mb-4">{error}</Alert>}
      <Table<LeaveRecord>
        columns={columns}
        data={records}
        loading={loading}
        emptyTitle="No leave requests here"
        emptyDescription={stage === 'supervisor' ? 'Nothing awaiting supervisor review.' : 'Nothing awaiting HR review.'}
      />

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject leave request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busyId === rejectTarget?.id} disabled={!rejectReason.trim()} onClick={submitReject}>
              Confirm Reject
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          placeholder="Why is this leave request being rejected?"
        />
      </Modal>
    </div>
  );
};

export default LeaveApprovals;
