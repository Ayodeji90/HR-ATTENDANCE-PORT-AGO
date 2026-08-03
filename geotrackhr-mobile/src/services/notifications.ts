import { api } from './api';
import type { AppNotification } from '../types';

/** GET /notification/user/:userId — the current user's notifications */
export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const response = await api.get(`/notification/user/${userId}`);
  return response.data.data as AppNotification[];
}

/** POST /notification/:id/read */
export async function markNotificationRead(id: string): Promise<AppNotification> {
  const response = await api.post(`/notification/${id}/read`);
  return response.data.data as AppNotification;
}
