import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { fetchEmployees, approveEmployee, rejectEmployee } from '@/services/employee';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';

type Employee = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
};

const PendingRegistrations: React.FC = () => {
  const [pending, setPending] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Employee | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    setLoading(true);
    fetchEmployees({ approval_status: 'pending' })
      .then((res) => {
        const data = (res.data.data as Omit<Employee, 'full_name'>[]).map((e) => ({
          ...e,
          full_name: `${e.first_name} ${e.last_name}`,
        }));
        setPending(data);
      })
      .catch(() => setError('Failed to load pending registrations.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleApprove = async (employee: Employee) => {
    setBusyId(employee.id);
    try {
      await approveEmployee(employee.id);
      load();
    } catch {
      setError('Failed to approve registration.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setBusyId(rejectTarget.id);
    try {
      await rejectEmployee(rejectTarget.id, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch {
      setError('Failed to reject registration.');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { header: 'Code', accessor: 'employee_code' as keyof Employee },
    { header: 'Name', accessor: 'full_name' as keyof Employee },
    { header: 'Email', accessor: 'email' as keyof Employee },
    {
      header: 'Actions',
      accessor: 'id' as keyof Employee,
      render: (row: Employee) => (
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
      <h1 className="mb-4">Pending Registrations</h1>
      {error && <Alert className="mb-4">{error}</Alert>}
      <Table<Employee>
        columns={columns}
        data={pending}
        loading={loading}
        emptyTitle="No pending registrations"
        emptyDescription="Self-registered employees awaiting approval will appear here."
      />

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title={`Reject ${rejectTarget?.full_name ?? ''}`}
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
          placeholder="Why is this registration being rejected?"
        />
      </Modal>
    </div>
  );
};

export default PendingRegistrations;
