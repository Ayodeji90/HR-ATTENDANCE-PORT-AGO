import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { useLookupMaps } from '@/hooks/useLookupMaps';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

type AttendanceSummary = Record<string, number>;
type LeaveBalance = Record<string, { entitlement: number | null; used: number; remaining: number | null }>;

const Reports: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceSummary>({});
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const { employeeNames, siteNames } = useLookupMaps();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    api
      .get('/report/daily', { params: { date: today } })
      .then((res) => setAttendance(res.data.data))
      .catch(() => {})
      .finally(() => setAttendanceLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEmployee) {
      setBalance(null);
      return;
    }
    setBalanceLoading(true);
    api
      .get('/report/leave-balance', { params: { employeeId: selectedEmployee } })
      .then((res) => setBalance(res.data.data.balance))
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false));
  }, [selectedEmployee]);

  const attendanceData = Object.entries(attendance).map(([siteId, count]) => ({
    site: siteNames[siteId] ?? siteId,
    count,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1>Reports</h1>
        <div className="flex gap-2 text-sm">
          <Link to="/reports/site" className="text-primary-600 hover:underline">
            Site report
          </Link>
          <span className="text-ink-300">·</span>
          <Link to="/reports/monthly" className="text-primary-600 hover:underline">
            Monthly payroll export
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Today's Attendance by Site">
          {attendanceLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : attendanceData.length === 0 ? (
            <EmptyState title="No attendance recorded today" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={attendanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEDEF" />
                <XAxis dataKey="site" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#C10726" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Leave Balance Lookup">
          <Select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="mb-4"
          >
            <option value="">Select an employee…</option>
            {Object.entries(employeeNames).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>

          {balanceLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !selectedEmployee ? (
            <p className="text-sm text-ink-400">Pick an employee to see their leave balance.</p>
          ) : balance ? (
            <div className="space-y-2">
              {Object.entries(balance).map(([type, b]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-ink-700">{type}</span>
                  <span className="text-ink-500">
                    {b.remaining === null ? 'No cap' : `${b.remaining} / ${b.entitlement} days left`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-primary-700">Failed to load balance.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Reports;
