import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchEmployees } from '@/services/employee';
import { assignEmployeesToSite, removeEmployeesFromSite } from '@/services/site';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

type Employee = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
};

const SiteAssignments: React.FC = () => {
  const { id: siteId } = useParams<{ id: string }>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    fetchEmployees()
      .then((res) => {
        const data = (res.data.data as Omit<Employee, 'full_name'>[]).map((e) => ({
          ...e,
          full_name: `${e.first_name} ${e.last_name}`,
        }));
        setEmployees(data);
      })
      .catch(() => setMessage({ tone: 'danger', text: 'Failed to load employees.' }))
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (empId: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(empId)) newSet.delete(empId);
      else newSet.add(empId);
      return newSet;
    });
  };

  const handleAssign = async () => {
    if (!siteId || selected.size === 0) return;
    setBusy(true);
    try {
      await assignEmployeesToSite(siteId, Array.from(selected));
      setMessage({ tone: 'success', text: `${selected.size} employee(s) assigned to this site.` });
      setSelected(new Set());
    } catch {
      setMessage({ tone: 'danger', text: 'Failed to assign employees.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!siteId || selected.size === 0) return;
    setBusy(true);
    try {
      await removeEmployeesFromSite(siteId, Array.from(selected));
      setMessage({ tone: 'success', text: `${selected.size} employee(s) removed from this site.` });
      setSelected(new Set());
    } catch {
      setMessage({ tone: 'danger', text: 'Failed to remove employees.' });
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { header: 'Code', accessor: 'employee_code' as keyof Employee },
    { header: 'Name', accessor: 'full_name' as keyof Employee },
  ];

  return (
    <div>
      <h1 className="mb-1">Assign Employees to Site</h1>
      <p className="mb-4 text-sm text-ink-500">Click a row to select or deselect an employee, then assign or remove.</p>
      {message && (
        <Alert tone={message.tone} className="mb-4">
          {message.text}
        </Alert>
      )}
      <Table<Employee>
        columns={columns}
        data={employees}
        loading={loading}
        onRowClick={(row) => toggleSelect(row.id)}
        rowClassName={(row) => (selected.has(row.id) ? 'bg-primary-50' : '')}
      />
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-ink-500">{selected.size} selected</span>
        <Button size="sm" loading={busy} disabled={selected.size === 0} onClick={handleAssign}>
          Assign Selected
        </Button>
        <Button size="sm" variant="danger" disabled={busy || selected.size === 0} onClick={handleRemove}>
          Remove Selected
        </Button>
      </div>
    </div>
  );
};

export default SiteAssignments;
