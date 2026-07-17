import React, { useEffect, useState } from 'react';
import { fetchAttendance, AttendanceRecord, EVENT_TYPE_LABELS } from '@/services/attendance';
import { useLookupMaps } from '@/hooks/useLookupMaps';
import Table from '@/components/ui/Table';
import Alert from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/Badge';

/**
 * Geofence violations are rejected outright at check-in time and never
 * stored (see attendance.controller.ts's verifyGeofence), so there is no
 * "outside geofence" record to list here. This page instead surfaces every
 * attendance record that was flagged with a reason — late arrivals,
 * very-late check-ins requiring HR sign-off, and rejections — which is the
 * closest honest equivalent of "needs a closer look".
 */
const LocationAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { employeeNames, siteNames } = useLookupMaps();

  useEffect(() => {
    fetchAttendance({ limit: 200 })
      .then((res) => {
        const data = res.data.data as AttendanceRecord[];
        setAlerts(data.filter((rec) => !!rec.reason));
      })
      .catch(() => setError('Failed to load flagged attendance records.'))
      .finally(() => setLoading(false));
  }, []);

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
    { header: 'Reason', accessor: 'reason' as keyof AttendanceRecord },
    {
      header: 'Status',
      accessor: 'status' as keyof AttendanceRecord,
      render: (row: AttendanceRecord) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <h1 className="mb-1">Attendance Alerts</h1>
      <p className="mb-4 text-sm text-ink-500">Check-ins flagged with a reason — late arrivals, very-late punches, and rejections.</p>
      {error && <Alert className="mb-4">{error}</Alert>}
      <Table<AttendanceRecord>
        columns={columns}
        data={alerts}
        loading={loading}
        emptyTitle="No flagged records"
        emptyDescription="Nothing needs a closer look right now."
      />
    </div>
  );
};

export default LocationAlerts;
