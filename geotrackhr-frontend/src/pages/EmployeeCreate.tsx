import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEmployee } from '@/services/employee';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const EmployeeCreate: React.FC = () => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Optional fields must be omitted (not sent as '') — the backend's
      // email validator rejects an empty string as an invalid format.
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await createEmployee(payload);
      navigate('/employees');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create employee.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-4">Create Employee</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" name="first_name" value={form.first_name} onChange={handleChange} required />
            <Input label="Last name" name="last_name" value={form.last_name} onChange={handleChange} required />
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
            <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
            <Input label="Department" name="department" value={form.department} onChange={handleChange} />
            <Input label="Designation" name="designation" value={form.designation} onChange={handleChange} />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={submitting}>
              Create Employee
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EmployeeCreate;
