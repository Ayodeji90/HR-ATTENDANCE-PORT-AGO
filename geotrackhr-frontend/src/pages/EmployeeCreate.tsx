import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEmployee } from '@/services/employee';
import { registerFacial } from '@/services/facial';
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

  // ── Post-create facial enrollment step ────────────────────────────────
  const [created, setCreated] = useState<{ id: string; first_name: string; last_name: string } | null>(null);
  const [facialFiles, setFacialFiles] = useState<File[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [facialError, setFacialError] = useState<string | null>(null);
  const [facialSuccess, setFacialSuccess] = useState<string | null>(null);
  const facialInputRef = useRef<HTMLInputElement>(null);

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
      const res = await createEmployee(payload);
      const employee = res.data;
      setCreated({ id: employee.id, first_name: employee.first_name, last_name: employee.last_name });
      setFacialError(null);
      setFacialSuccess(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create employee.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFacialFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFacialError(null);
    setFacialSuccess(null);
    setFacialFiles(Array.from(e.target.files ?? []).slice(0, 3));
  };

  const handleEnrollFace = async () => {
    if (!created) return;
    if (facialFiles.length === 0) {
      setFacialError('Select at least one photo of the employee to enroll.');
      return;
    }
    setEnrolling(true);
    setFacialError(null);
    setFacialSuccess(null);
    try {
      await registerFacial(created.id, facialFiles);
      setFacialSuccess('Face enrolled — this employee can now punch with live facial verification.');
      setFacialFiles([]);
    } catch (err: any) {
      setFacialError(err?.response?.data?.error?.message ?? 'Failed to enroll face. Try different photos.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDone = (goToProfile: boolean) => {
    if (created && goToProfile) {
      navigate(`/employees/${created.id}`);
    } else {
      navigate('/employees');
    }
  };

  if (created) {
    return (
      <div className="max-w-xl">
        <h1 className="mb-4">Employee created</h1>
        <Alert tone="success" className="mb-4">
          {created.first_name} {created.last_name} has been registered.
        </Alert>
        <Card title="Facial enrollment (recommended)">
          <p className="mb-3 text-sm text-ink-500">
            Upload 1–3 clear, front-facing photos of the employee now — otherwise they cannot punch until a face is
            enrolled (unless demo mode is on). This can also be done later from their profile.
          </p>
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
            <Button size="sm" onClick={handleEnrollFace} loading={enrolling} disabled={facialFiles.length === 0}>
              Enroll face
            </Button>
            {facialFiles.length > 0 && (
              <button type="button" className="text-sm text-ink-500 hover:text-ink-700" onClick={() => setFacialFiles([])}>
                Clear selection
              </button>
            )}
          </div>
          <div className="mt-5 flex gap-3 border-t border-ink-100 pt-4">
            <Button variant="secondary" onClick={() => handleDone(false)}>
              Skip — go to employee list
            </Button>
            <Button onClick={() => handleDone(true)}>Open profile</Button>
          </div>
        </Card>
      </div>
    );
  }

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
