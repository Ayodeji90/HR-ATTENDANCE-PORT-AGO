import { api } from './api';
import type { Site } from '../types';

/** GET /sites — active construction sites for the site selector */
export async function fetchSites(): Promise<Site[]> {
  const response = await api.get('/sites', { params: { limit: 100 } });
  const data = response.data.data as { data: Site[]; total: number };
  return (data.data ?? []).filter((site) => site.is_active);
}
