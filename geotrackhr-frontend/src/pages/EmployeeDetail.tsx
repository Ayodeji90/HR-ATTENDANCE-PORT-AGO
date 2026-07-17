import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEmployee, updateEmployee, deactivateEmployee } from '@/services/employee';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';

type Employee = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
};

const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<Partial<Employee>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchEmployee(id)
      .then((res) => {
        setEmployee(res.data);
        setForm(res.data);
      })
      .catch(() => setError('Failed to load employee.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await updateEmployee(id, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        phone: form.phone || null,
        department: form.department || null,
        designation: form.designation || null,
      });
      setEmployee(res.data);
      setSuccess('Employee updated.');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!id || !window.confirm('Deactivate this employee?')) return;
    await deactivateEmployee(id);
    navigate('/employees');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!employee) {
    return <Alert>Employee not found.</Alert>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1>{employee.first_name} {employee.last_name}</h1>
          <p className="text-sm text-ink-500">{employee.employee_code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={employee.is_active ? 'success' : 'neutral'}>{employee.is_active ? 'Active' : 'Inactive'}</Badge>
          <Badge tone={employee.approval_status === 'approved' ? 'success' : employee.approval_status === 'rejected' ? 'danger' : 'warning'}>
            {employee.approval_status}
          </Badge>
        </div>
      </div>

      <Card title="Employee details">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" name="first_name" value={form.first_name ?? ''} onChange={handleChange} required />
            <Input label="Last name" name="last_name" value={form.last_name ?? ''} onChange={handleChange} required />
            <Input label="Email" name="email" type="email" value={form.email ?? ''} onChange={handleChange} />
            <Input label="Phone" name="phone" value={form.phone ?? ''} onChange={handleChange} />
            <Input label="Department" name="department" value={form.department ?? ''} onChange={handleChange} />
            <Input label="Designation" name="designation" value={form.designation ?? ''} onChange={handleChange} />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="danger" onClick={handleDeactivate}>
              Deactivate
            </Button>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EmployeeDetail;
