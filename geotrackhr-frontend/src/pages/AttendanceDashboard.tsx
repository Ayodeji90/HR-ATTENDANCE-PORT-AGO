import React, { useEffect, useState } from 'react';
import { formatISO } from 'date-fns';
import api from '@/services/api';
import { useLookupMaps } from '@/hooks/useLookupMaps';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';

type Summary = Record<string, number>;

const AttendanceDashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary>({});
  const [date, setDate] = useState<string>(formatISO(new Date(), { representation: 'date' }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { siteNames } = useLookupMaps();

  useEffect(() => {
    setLoading(true);
    api
      .get('/report/daily', { params: { date } })
      .then((res) => setSummary(res.data.data))
      .catch(() => setError('Failed to load the daily summary.'))
      .finally(() => setLoading(false));
  }, [date]);

  const entries = Object.entries(summary);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1>Live Attendance</h1>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
      </div>
      {error && <Alert className="mb-4">{error}</Alert>}
      <Card title="Punches per site">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState title="No attendance recorded for this date" />
        ) : (
          <div className="divide-y divide-ink-100">
            {entries.map(([siteId, count]) => (
              <div key={siteId} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-ink-800">{siteNames[siteId] ?? siteId}</span>
                <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">{count}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AttendanceDashboard;
