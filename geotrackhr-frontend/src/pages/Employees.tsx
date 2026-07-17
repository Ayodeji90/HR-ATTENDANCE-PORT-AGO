import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { fetchEmployees } from '@/services/employee';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

type Employee = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  is_active: boolean;
};

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees()
      .then((res) => {
        const data = (res.data.data as Omit<Employee, 'full_name'>[]).map((e) => ({
          ...e,
          full_name: `${e.first_name} ${e.last_name}`,
        }));
        setEmployees(data);
      })
      .catch(() => setError('Failed to load employees.'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Code', accessor: 'employee_code' as keyof Employee },
    { header: 'Name', accessor: 'full_name' as keyof Employee },
    { header: 'Department', accessor: 'department' as keyof Employee },
    { header: 'Email', accessor: 'email' as keyof Employee },
    {
      header: 'Status',
      accessor: 'is_active' as keyof Employee,
      render: (row: Employee) => <Badge tone={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1>Employees</h1>
        <Button onClick={() => navigate('/employees/create')}>
          <UserPlus size={16} />
          New Employee
        </Button>
      </div>
      {error && <Alert className="mb-4">{error}</Alert>}
      <Table<Employee>
        columns={columns}
        data={employees}
        loading={loading}
        emptyTitle="No employees yet"
        emptyDescription="Employees you create or approve will show up here."
        onRowClick={(row) => navigate(`/employees/${row.id}`)}
      />
    </div>
  );
};

export default Employees;
