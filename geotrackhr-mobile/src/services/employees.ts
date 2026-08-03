import { api } from './api';
import type { Employee } from '../types';

/** GET /employees/me — the current user's linked employee record */
export async function fetchMe(): Promise<Employee> {
  const response = await api.get('/employees/me');
  return response.data.data as Employee;
}
