import React, { useEffect, useState } from 'react';
import { formatISO, subDays } from 'date-fns';
import api from '@/services/api';
import { useLookupMaps } from '@/hooks/useLookupMaps';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';

type SiteReportData = {
  siteId: string;
  count: number;
  period: { startDate: string; endDate: string };
};

const SiteReport: React.FC = () => {
  const { siteNames } = useLookupMaps();
  const [siteId, setSiteId] = useState('');
  const [startDate, setStartDate] = useState(formatISO(subDays(new Date(), 7), { representation: 'date' }));
  const [endDate, setEndDate] = useState(formatISO(new Date(), { representation: 'date' }));
  const [report, setReport] = useState<SiteReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId || !startDate || !endDate) {
      setReport(null);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get('/report/site', { params: { siteId, startDate, endDate } })
      .then((res) => setReport(res.data.data))
      .catch(() => setError('Failed to load the site report.'))
      .finally(() => setLoading(false));
  }, [siteId, startDate, endDate]);

  return (
    <div className="max-w-xl">
      <h1 className="mb-4">Site Attendance Report</h1>
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Site" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="">Select a site…</option>
            {Object.entries(siteNames).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
          <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="mt-6">
          {!siteId ? (
            <p className="text-sm text-ink-400">Select a site to see its attendance count for the period.</p>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <Alert>{error}</Alert>
          ) : report ? (
            <div className="rounded-lg bg-ink-50 p-4 text-center">
              <p className="text-3xl font-semibold text-primary-700">{report.count}</p>
              <p className="mt-1 text-sm text-ink-500">
                punches at {siteNames[siteId] ?? siteId} from {report.period.startDate} to {report.period.endDate}
              </p>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default SiteReport;
