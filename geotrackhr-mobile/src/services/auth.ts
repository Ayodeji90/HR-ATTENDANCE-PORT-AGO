import axios from 'axios';

const API_BASE = 'http://localhost:5000/api'; // adjust to backend URL if needed

export interface LoginResponse {
  token: string;
  userId: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_BASE}/auth/login`, {
    email,
    password,
  });
  return response.data;
};

export const register = async (
  name: string,
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_BASE}/auth/register`, {
    name,
    email,
    password,
  });
  return response.data;
};
