import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { fetchAttendance, approveAttendance, rejectAttendance, AttendanceRecord, EVENT_TYPE_LABELS } from '@/services/attendance';
import { useLookupMaps } from '@/hooks/useLookupMaps';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';

const PendingAttendance: React.FC = () => {
  const [pending, setPending] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AttendanceRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { employeeNames, siteNames } = useLookupMaps();

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await fetchAttendance({ status: 'pending', limit: 200 });
      setPending(res.data.data);
    } catch {
      setError('Failed to load pending attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (record: AttendanceRecord) => {
    setBusyId(record.id);
    try {
      await approveAttendance(record.id);
      await loadPending();
    } catch {
      setError('Failed to approve attendance record.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setBusyId(rejectTarget.id);
    try {
      await rejectAttendance(rejectTarget.id, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason('');
      await loadPending();
    } catch {
      setError('Failed to reject attendance record.');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    {
      header: 'Employee',
      accessor: 'employee_id' as keyof AttendanceRecord,
      render: (row: AttendanceRecord) => employeeNames[row.employee_id] ?? row.employee_id,
    },
    {
      header: 'Site',
      accessor: 'site_id' as keyof AttendanceRecord,
      render: (row: AttendanceRecord) => siteNames[row.site_id] ?? row.site_id ?? '—',
    },
    {
      header: 'Type',
      accessor: 'event_type' as keyof AttendanceRecord,
      render: (row: AttendanceRecord) => EVENT_TYPE_LABELS[row.event_type],
    },
    { header: 'Date', accessor: 'event_date' as keyof AttendanceRecord },
    { header: 'Time', accessor: 'event_time' as keyof AttendanceRecord },
    { header: 'Reason', accessor: 'reason' as keyof AttendanceRecord },
    {
      header: 'Actions',
      accessor: 'id' as keyof AttendanceRecord,
      render: (row: AttendanceRecord) => (
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
      <h1 className="mb-4">Pending Attendance Approvals</h1>
      {error && <Alert className="mb-4">{error}</Alert>}
      <Table<AttendanceRecord>
        columns={columns}
        data={pending}
        loading={loading}
        emptyTitle="No pending attendance"
        emptyDescription="Late or after-hours check-ins awaiting approval will appear here."
      />

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject attendance record"
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
          placeholder="Why is this attendance record being rejected?"
        />
      </Modal>
    </div>
  );
};

export default PendingAttendance;
