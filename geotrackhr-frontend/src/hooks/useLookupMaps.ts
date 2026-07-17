import { useEffect, useState } from 'react';
import { fetchEmployees } from '@/services/employee';
import { fetchSites } from '@/services/site';

/**
 * Fetches employees + sites once and exposes id -> display-name maps, so
 * attendance/leave tables can show "James Wilson" / "Downtown Tower" instead
 * of raw UUIDs.
 */
export function useLookupMaps() {
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});
  const [siteNames, setSiteNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchEmployees({ limit: 1000 }).then((res) => {
        const map: Record<string, string> = {};
        for (const e of res.data.data) map[e.id] = `${e.first_name} ${e.last_name}`;
        setEmployeeNames(map);
      }),
      fetchSites({ limit: 1000 }).then((res) => {
        const map: Record<string, string> = {};
        for (const s of res.data.data) map[s.id] = s.name;
        setSiteNames(map);
      }),
    ])
      .catch(() => {
        // non-fatal — tables fall back to showing raw IDs
      })
      .finally(() => setLoading(false));
  }, []);

  return { employeeNames, siteNames, loading };
}
