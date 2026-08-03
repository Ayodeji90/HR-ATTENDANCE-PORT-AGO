import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { fetchNotifications, markNotificationRead } from '../services/notifications';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import type { AppNotification } from '../types';
import { colors, spacing } from '../theme';

const NotificationsScreen = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const list = await fetchNotifications(userId).catch(() => []);
    setNotifications(list);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePress = async (item: AppNotification) => {
    if (item.is_read) return;
    // Optimistically mark read, then reconcile with the server.
    setNotifications((list) =>
      list.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
    );
    await markNotificationRead(item.id).catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Screen title="Notifications" subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}>
      {loading ? (
        <ActivityIndicator color={colors.primary[600]} style={{ marginTop: spacing.xxl }} />
      ) : notifications.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No notifications yet.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {notifications.map((item) => (
            <Pressable key={item.id} onPress={() => handlePress(item)}>
              <Card style={[styles.item, !item.is_read && styles.unread]}>
                <View style={styles.dotRow}>
                  {!item.is_read ? <View style={styles.dot} /> : null}
                  <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.message}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  item: { paddingVertical: 12 },
  unread: { borderColor: colors.primary[300], borderWidth: 1.5 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[500] },
  time: { fontSize: 11, color: colors.ink[400] },
  title: { fontSize: 14, fontWeight: '600', color: colors.ink[800] },
  body: { marginTop: 3, fontSize: 13, color: colors.ink[600], lineHeight: 19 },
  empty: { fontSize: 14, color: colors.ink[500] },
});

export default NotificationsScreen;
