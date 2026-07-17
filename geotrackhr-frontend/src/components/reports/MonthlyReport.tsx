import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { useLookupMaps } from '@/hooks/useLookupMaps';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';

type MonthlyData = Record<string, number>; // employeeId -> count

type Row = { employeeId: string; name: string; count: number };

const now = new Date();

const MonthlyReport: React.FC = () => {
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [data, setData] = useState<MonthlyData>({});
  const [loading, setLoading] = useState(false);
  const { employeeNames } = useLookupMaps();

  useEffect(() => {
    if (!month || !year) return;
    setLoading(true);
    api
      .get('/report/monthly', { params: { month, year } })
      .then((res) => setData(res.data.data))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, [month, year]);

  const rows: Row[] = Object.entries(data).map(([employeeId, count]) => ({
    employeeId,
    name: employeeNames[employeeId] ?? employeeId,
    count,
  }));

  const columns = [
    { header: 'Employee', accessor: 'name' as keyof Row },
    { header: 'Punches', accessor: 'count' as keyof Row },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4">Monthly Attendance Summary</h1>
      <Card>
        <div className="mb-4 grid grid-cols-2 gap-4 sm:w-64">
          <Input label="Month" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(e.target.value)} />
          <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <Table<Row>
          columns={columns}
          data={rows}
          loading={loading}
          emptyTitle="No punches this month"
          emptyDescription="Useful for building the payroll export once data exists."
        />
      </Card>
    </div>
  );
};

export default MonthlyReport;
