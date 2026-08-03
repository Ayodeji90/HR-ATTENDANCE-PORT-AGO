import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMe } from '../services/employees';
import { fetchAttendanceHistory } from '../services/attendance';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { AttendanceEventType, AttendanceRecord, Employee } from '../types';
import { colors, spacing, typography } from '../theme';

const EVENT_LABELS: Record<AttendanceEventType, string> = {
  check_in: 'Check-in',
  afternoon_confirm: 'Afternoon',
  check_out: 'Check-out',
};

const STATUS_TONE = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
} as const;

const AttendanceHistoryScreen = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const me = (await fetchMe().catch(() => null)) as Employee | null;
    if (me) {
      const history = await fetchAttendanceHistory(me.id).catch(() => []);
      setRecords(history);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen title="My attendance">
        <ActivityIndicator color={colors.primary[600]} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  return (
    <Screen title="My attendance" subtitle="Every punch, newest first">
      {records.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No attendance recorded yet. Check in from the Home tab.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {records.map((rec) => (
            <Card key={rec.id} style={styles.item}>
              <View style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.event}>{EVENT_LABELS[rec.event_type]}</Text>
                  <Text style={styles.meta}>
                    {rec.event_date} · {rec.event_time.slice(0, 5)}
                  </Text>
                </View>
                <Badge label={rec.status} tone={STATUS_TONE[rec.status]} />
              </View>
              {rec.reason ? <Text style={styles.reason}>Reason: {rec.reason}</Text> : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  item: { paddingVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowMain: { gap: 2, flex: 1, paddingRight: spacing.md },
  event: { fontSize: 14, fontWeight: '600', color: colors.ink[800] },
  meta: { fontSize: 12, color: colors.ink[500] },
  reason: { marginTop: 6, fontSize: 12, color: colors.warning[600], fontStyle: 'italic' },
  empty: { fontSize: 14, color: colors.ink[500] },
});

export default AttendanceHistoryScreen;
