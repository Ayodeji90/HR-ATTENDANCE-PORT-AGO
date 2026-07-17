import React, { useEffect, useState } from 'react';
import { formatISO } from 'date-fns';
import { fetchAttendance, AttendanceRecord, EVENT_TYPE_LABELS } from '@/services/attendance';
import { useLookupMaps } from '@/hooks/useLookupMaps';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/Badge';

const DailyAttendance: React.FC = () => {
  const [date, setDate] = useState<string>(formatISO(new Date(), { representation: 'date' }));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { employeeNames, siteNames } = useLookupMaps();

  useEffect(() => {
    setLoading(true);
    fetchAttendance({ date, limit: 200 })
      .then((res) => setRecords(res.data.data))
      .catch(() => setError('Failed to load attendance for this date.'))
      .finally(() => setLoading(false));
  }, [date]);

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
    { header: 'Time', accessor: 'event_time' as keyof AttendanceRecord },
    {
      header: 'Status',
      accessor: 'status' as keyof AttendanceRecord,
      render: (row: AttendanceRecord) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1>Daily Attendance</h1>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
      </div>
      {error && <Alert className="mb-4">{error}</Alert>}
      <Table<AttendanceRecord>
        columns={columns}
        data={records}
        loading={loading}
        emptyTitle="No attendance records"
        emptyDescription="No check-ins or check-outs were recorded for this date."
      />
    </div>
  );
};

export default DailyAttendance;
