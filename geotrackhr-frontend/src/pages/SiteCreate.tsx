import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSite } from '@/services/site';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const SiteCreate: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: '150',
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
      await createSite({
        name: form.name,
        address: form.address || undefined,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radius: Number(form.radius),
      });
      navigate('/sites');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create site.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-4">Create Site</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} hint="Street address for display purposes" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Latitude" name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} required />
            <Input label="Longitude" name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} required />
            <Input label="Radius (m)" name="radius" type="number" value={form.radius} onChange={handleChange} required hint="Geofence radius" />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={submitting}>
              Create Site
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SiteCreate;
