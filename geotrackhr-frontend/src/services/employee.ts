import api from './api';

export const fetchEmployees = async (params?: Record<string, unknown>) => {
  const response = await api.get('/employees', { params });
  return response.data;
};

export const fetchEmployee = async (id: string) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (payload: any) => {
  const response = await api.post('/employees', payload);
  return response.data;
};

export const updateEmployee = async (id: string, payload: any) => {
  const response = await api.put(`/employees/${id}`, payload);
  return response.data;
};

export const deactivateEmployee = async (id: string) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};

export const approveEmployee = async (id: string) => {
  const response = await api.post(`/employees/${id}/approve`);
  return response.data;
};

export const rejectEmployee = async (id: string, reason: string) => {
  const response = await api.post(`/employees/${id}/reject`, { reason });
  return response.data;
};
