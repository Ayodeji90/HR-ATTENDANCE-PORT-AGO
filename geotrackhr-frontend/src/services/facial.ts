import api from './api';

export type FacialStatus = {
  enrolled: boolean;
  model_version?: string;
  quality_score?: string | number | null;
  image_count?: number;
  created_at?: string;
};

export type FacialVerifyResult = {
  verified: boolean;
  distance: number;
  threshold: number;
};

/** Upload reference photos (1-3) to enroll an employee's face template. */
export const registerFacial = async (employeeId: string, files: File[]) => {
  const form = new FormData();
  files.forEach((f) => form.append('images', f));
  const response = await api.post(`/facial/register/${employeeId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

/** Check whether an employee has an enrolled face template. */
export const fetchFacialStatus = async (employeeId: string): Promise<FacialStatus> => {
  const response = await api.get(`/facial/status/${employeeId}`);
  return response.data.data as FacialStatus;
};

/** Verify a single selfie against the employee's stored template. */
export const verifyFacial = async (employeeId: string, selfie: File): Promise<FacialVerifyResult> => {
  const form = new FormData();
  form.append('selfie', selfie);
  const response = await api.post(`/facial/verify/${employeeId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data as FacialVerifyResult;
};
