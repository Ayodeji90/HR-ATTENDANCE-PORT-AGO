import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { fetchSites } from '@/services/site';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
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

const Sites: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSites()
      .then((res) => setSites(res.data.data))
      .catch(() => setError('Failed to load sites.'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { header: 'Code', accessor: 'code' as keyof Site },
    { header: 'Name', accessor: 'name' as keyof Site },
    {
      header: 'Location',
      accessor: 'address_line1' as keyof Site,
      render: (row: Site) => [row.address_line1, row.city].filter(Boolean).join(', ') || '—',
    },
    { header: 'Radius (m)', accessor: 'radius_meters' as keyof Site },
    {
      header: 'Status',
      accessor: 'is_active' as keyof Site,
      render: (row: Site) => <Badge tone={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1>Sites</h1>
        <Button onClick={() => navigate('/sites/create')}>
          <Plus size={16} />
          New Site
        </Button>
      </div>
      {error && <Alert className="mb-4">{error}</Alert>}
      <Table<Site>
        columns={columns}
        data={sites}
        loading={loading}
        emptyTitle="No sites yet"
        emptyDescription="Construction sites you create will show up here."
        onRowClick={(row) => navigate(`/sites/${row.id}`)}
      />
    </div>
  );
};

export default Sites;
