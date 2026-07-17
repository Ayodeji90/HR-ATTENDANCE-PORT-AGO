import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchEmployeeLeaves, LeaveRecord, LEAVE_TYPE_LABELS } from '@/services/leave';
import { useLookupMaps } from '@/hooks/useLookupMaps';
import Table from '@/components/ui/Table';
import Alert from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/Badge';

const EmployeeLeaves: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { employeeNames } = useLookupMaps();

  useEffect(() => {
    if (!employeeId) return;
    fetchEmployeeLeaves(employeeId)
      .then((res) => setLeaves(res.data.data))
      .catch(() => setError('Failed to load leave history.'))
      .finally(() => setLoading(false));
  }, [employeeId]);

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
      header: 'Status',
      accessor: 'status' as keyof LeaveRecord,
      render: (row: LeaveRecord) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <h1 className="mb-4">Leave History{employeeId && employeeNames[employeeId] ? ` — ${employeeNames[employeeId]}` : ''}</h1>
      {error && <Alert className="mb-4">{error}</Alert>}
      <Table<LeaveRecord> columns={columns} data={leaves} loading={loading} emptyTitle="No leave requests" />
    </div>
  );
};

export default EmployeeLeaves;
