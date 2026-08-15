import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEmployee, updateEmployee, deactivateEmployee } from '@/services/employee';
import { registerFacial, fetchFacialStatus, FacialStatus } from '@/services/facial';
import { useAuthStore } from '@/store/authStore';
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

  // ── Facial enrollment ────────────────────────────────────────────────
  const [facial, setFacial] = useState<FacialStatus | null>(null);
  const [facialFiles, setFacialFiles] = useState<File[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [facialError, setFacialError] = useState<string | null>(null);
  const [facialSuccess, setFacialSuccess] = useState<string | null>(null);
  const facialInputRef = useRef<HTMLInputElement>(null);
  const role = useAuthStore((s) => s.user?.role);
  const canEnroll = role === 'admin' || role === 'hr';

  useEffect(() => {
    if (!id) return;
    fetchEmployee(id)
      .then((res) => {
        setEmployee(res.data);
        setForm(res.data);
      })
      .catch(() => setError('Failed to load employee.'))
      .finally(() => setLoading(false));
    if (canEnroll) {
      fetchFacialStatus(id)
        .then(setFacial)
        .catch(() => undefined);
    }
  }, [id, canEnroll]);

  const handleFacialFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFacialError(null);
    setFacialSuccess(null);
    setFacialFiles(Array.from(e.target.files ?? []).slice(0, 3));
  };

  const handleEnroll = async () => {
    if (!id) return;
    if (facialFiles.length === 0) {
      setFacialError('Select at least one photo of the employee to enroll.');
      return;
    }
    setEnrolling(true);
    setFacialError(null);
    setFacialSuccess(null);
    try {
      await registerFacial(id, facialFiles);
      setFacialSuccess('Face enrolled — the employee can now punch with live facial verification.');
      setFacialFiles([]);
      const status = await fetchFacialStatus(id);
      setFacial(status);
    } catch (err: any) {
      setFacialError(err?.response?.data?.error?.message ?? 'Failed to enroll face. Try different photos.');
    } finally {
      setEnrolling(false);
    }
  };

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

      {canEnroll && (
        <Card title="Facial enrollment" className="mt-6">
          <p className="mb-3 text-sm text-ink-500">
            Upload 1–3 clear, front-facing photos of the employee. The live selfie at punch time must match these photos
            — anyone else trying to punch on their behalf will be rejected.
          </p>
          {facial?.enrolled ? (
            <Alert tone="success" className="mb-3">
              Face enrolled ({facial.image_count} photo{facial.image_count === 1 ? '' : 's'} ·{' '}
              {facial.model_version ?? 'model'}). Re-enrolling replaces the template.
            </Alert>
          ) : (
            <Alert tone="warning" className="mb-3">
              No face enrolled — this employee cannot punch until HR registers their face (unless demo mode is on).
            </Alert>
          )}
          {facialError && <Alert tone="danger" className="mb-3">{facialError}</Alert>}
          {facialSuccess && <Alert tone="success" className="mb-3">{facialSuccess}</Alert>}
          <input
            ref={facialInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFacialFiles}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => facialInputRef.current?.click()}>
              {facialFiles.length > 0 ? `${facialFiles.length} photo(s) selected` : 'Choose photos'}
            </Button>
            <Button size="sm" onClick={handleEnroll} loading={enrolling} disabled={facialFiles.length === 0}>
              {facial?.enrolled ? 'Re-enroll face' : 'Enroll face'}
            </Button>
            {facialFiles.length > 0 && (
              <button
                type="button"
                className="text-sm text-ink-500 hover:text-ink-700"
                onClick={() => setFacialFiles([])}
              >
                Clear selection
              </button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EmployeeDetail;
