import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchSite, updateSite, deactivateSite } from '@/services/site';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';

type Site = {
  id: string;
  name: string;
  code: string;
  address_line1?: string | null;
  city?: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
};

const SiteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<Site | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchSite(id)
      .then((res) => {
        const s: Site = res.data;
        setSite(s);
        setForm({
          name: s.name,
          address: s.address_line1 ?? '',
          latitude: String(s.latitude),
          longitude: String(s.longitude),
          radius: String(s.radius_meters),
        });
      })
      .catch(() => setError('Failed to load site.'))
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
      const res = await updateSite(id, {
        name: form.name,
        address: form.address,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radius: Number(form.radius),
      });
      setSite(res.data);
      setSuccess('Site updated.');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!id || !window.confirm('Deactivate this site?')) return;
    await deactivateSite(id);
    navigate('/sites');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!site) {
    return <Alert>Site not found.</Alert>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1>{site.name}</h1>
          <p className="text-sm text-ink-500">{site.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={site.is_active ? 'success' : 'neutral'}>{site.is_active ? 'Active' : 'Inactive'}</Badge>
          <Link to={`/sites/${site.id}/assignments`}>
            <Button variant="secondary" size="sm">
              Manage Assignments
            </Button>
          </Link>
        </div>
      </div>

      <Card title="Site details">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}
          <Input label="Name" name="name" value={form.name ?? ''} onChange={handleChange} required />
          <Input label="Address" name="address" value={form.address ?? ''} onChange={handleChange} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Latitude" name="latitude" type="number" step="any" value={form.latitude ?? ''} onChange={handleChange} required />
            <Input label="Longitude" name="longitude" type="number" step="any" value={form.longitude ?? ''} onChange={handleChange} required />
            <Input label="Radius (m)" name="radius" type="number" value={form.radius ?? ''} onChange={handleChange} required />
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

export default SiteDetail;
