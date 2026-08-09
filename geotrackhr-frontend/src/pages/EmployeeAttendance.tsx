import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchEmployeeAttendanceHistory, AttendanceRecord, EVENT_TYPE_LABELS } from '@/services/attendance';
import { useLookupMaps } from '@/hooks/useLookupMaps';
import Table from '@/components/ui/Table';
import Alert from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/Badge';

const EmployeeAttendance: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { employeeNames, siteNames } = useLookupMaps();

  useEffect(() => {
    if (!employeeId) return;
    fetchEmployeeAttendanceHistory(employeeId)
      .then((records) => setRecords(records))
      .catch(() => setError('Failed to load attendance history.'))
      .finally(() => setLoading(false));
  }, [employeeId]);

  const columns = [
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
    {
      header: 'Status',
      accessor: 'status' as keyof AttendanceRecord,
      render: (row: AttendanceRecord) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <h1 className="mb-4">Attendance History{employeeId && employeeNames[employeeId] ? ` — ${employeeNames[employeeId]}` : ''}</h1>
      {error && <Alert className="mb-4">{error}</Alert>}
      <Table<AttendanceRecord> columns={columns} data={records} loading={loading} emptyTitle="No attendance history" />
    </div>
  );
};

export default EmployeeAttendance;
