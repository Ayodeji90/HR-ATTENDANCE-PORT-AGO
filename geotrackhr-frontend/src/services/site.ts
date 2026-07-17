import api from './api';

export const fetchSites = async (params?: Record<string, unknown>) => {
  const response = await api.get('/sites', { params });
  return response.data;
};

export const fetchSite = async (id: string) => {
  const response = await api.get(`/sites/${id}`);
  return response.data;
};

export const createSite = async (payload: any) => {
  const response = await api.post('/sites', payload);
  return response.data;
};

export const updateSite = async (id: string, payload: any) => {
  const response = await api.put(`/sites/${id}`, payload);
  return response.data;
};

export const deactivateSite = async (id: string) => {
  const response = await api.delete(`/sites/${id}`);
  return response.data;
};

export const assignEmployeesToSite = async (siteId: string, employeeIds: string[]) => {
  const response = await api.post(`/sites/${siteId}/assign`, { employeeIds });
  return response.data;
};

export const removeEmployeesFromSite = async (siteId: string, employeeIds: string[]) => {
  const response = await api.post(`/sites/${siteId}/remove`, { employeeIds });
  return response.data;
};
