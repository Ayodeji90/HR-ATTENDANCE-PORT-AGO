import knex, { Knex } from 'knex';
import { knexfile } from '@database/knexfile';

/** Types for the notifications table (matches migrations/006_notifications.ts) */
export interface NotificationRecord {
  id: string;
  recipient_id: string | null;
  notification_type: string;
  title: string;
  message: string;
  reference_type?: string | null;
  reference_id?: string | null;
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CreateNotificationInput {
  recipient_id: string;
  notification_type: string;
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: string;
}

const environment = process.env.NODE_ENV || 'development';
const db: Knex = knex(knexfile[environment] ?? knexfile.development);

export const notificationModel = {
  async findById(id: string): Promise<NotificationRecord | undefined> {
    return db<NotificationRecord>('notifications').where({ id }).first();
  },

  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const [record] = await db<NotificationRecord>('notifications')
      .insert({ ...input, is_read: false })
      .returning('*');
    return record;
  },

  async findByUser(userId: string, options: { unreadOnly?: boolean } = {}): Promise<NotificationRecord[]> {
    const query = db<NotificationRecord>('notifications').where({ recipient_id: userId });
    if (options.unreadOnly) query.andWhere({ is_read: false });
    return query.orderBy('created_at', 'desc');
  },

  async markAsRead(id: string): Promise<NotificationRecord> {
    const [record] = await db<NotificationRecord>('notifications')
      .where({ id })
      .update({ is_read: true, read_at: db.fn.now() })
      .returning('*');
    return record;
  },
};
