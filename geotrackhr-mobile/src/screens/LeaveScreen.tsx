import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMe } from '../services/employees';
import { fetchLeaveHistory, submitLeave } from '../services/leave';
import { getErrorMessage } from '../services/api';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import type { LeaveRecord, LeaveStatus, LeaveType } from '../types';
import { colors, radius, spacing, typography } from '../theme';

const LEAVE_TYPES: LeaveType[] = ['annual', 'sick', 'casual', 'emergency', 'maternity', 'unpaid'];
const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual',
  sick: 'Sick',
  casual: 'Casual',
  emergency: 'Emergency',
  maternity: 'Maternity',
  unpaid: 'Unpaid',
};

const STATUS_TONE: Record<LeaveStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'warning',
  approved_by_supervisor: 'info',
  approved_by_hr: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

const STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved_by_supervisor: 'Supervisor approved',
  approved_by_hr: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

type Tab = 'request' | 'history';

const LeaveScreen = () => {
  const [tab, setTab] = useState<Tab>('request');

  // Request form state
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History state
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    const me = (await fetchMe().catch(() => null)) as { id: string } | null;
    if (!me) return;
    setLoadingHistory(true);
    const history = await fetchLeaveHistory(me.id).catch(() => []);
    setLeaves(history);
    setLoadingHistory(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleSubmit = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      Alert.alert('Invalid dates', 'Use YYYY-MM-DD format for start and end dates.');
      return;
    }
    setSubmitting(true);
    try {
      await submitLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        half_day: halfDay,
        reason: reason.trim() || undefined,
      });
      Alert.alert('Submitted', 'Your leave request is pending supervisor approval.');
      setStartDate('');
      setEndDate('');
      setReason('');
      setHalfDay(false);
      loadHistory();
    } catch (err) {
      Alert.alert('Request failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="Leave">
      <View style={styles.segmented}>
        {(['request', 'history'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.segment, tab === t && styles.segmentActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.segmentText, tab === t && styles.segmentTextActive]}>
              {t === 'request' ? 'New request' : 'My requests'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'request' ? (
        <View>
          <Text style={[typography.section, styles.label]}>Leave type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
            {LEAVE_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[styles.typeChip, leaveType === t && styles.typeChipActive]}
                onPress={() => setLeaveType(t)}
              >
                <Text style={[styles.typeChipText, leaveType === t && styles.typeChipTextActive]}>
                  {LEAVE_TYPE_LABELS[t]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Input label="Start (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2026-08-10" autoCapitalize="none" />
            </View>
            <View style={styles.dateField}>
              <Input label="End (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} placeholder="2026-08-14" autoCapitalize="none" />
            </View>
          </View>

          <Pressable style={styles.halfDayRow} onPress={() => setHalfDay((h) => !h)}>
            <View style={[styles.checkbox, halfDay && styles.checkboxChecked]}>
              {halfDay ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <Text style={styles.halfDayText}>Half day</Text>
          </Pressable>

          <Input
            label="Reason"
            value={reason}
            onChangeText={setReason}
            placeholder="Optional — why do you need this leave?"
            multiline
            style={styles.reasonInput}
          />

          <Button title="Submit request" onPress={handleSubmit} loading={submitting} />
        </View>
      ) : loadingHistory ? (
        <ActivityIndicator color={colors.primary[600]} style={{ marginTop: spacing.xxl }} />
      ) : leaves.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No leave requests yet.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {leaves.map((leave) => (
            <Card key={leave.id} style={styles.item}>
              <View style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.event}>{LEAVE_TYPE_LABELS[leave.leave_type]}</Text>
                  <Text style={styles.meta}>
                    {leave.start_date} → {leave.end_date} · {leave.duration_days} day{leave.duration_days === 1 ? '' : 's'}
                  </Text>
                </View>
                <Badge label={STATUS_LABELS[leave.status]} tone={STATUS_TONE[leave.status]} />
              </View>
              {leave.reason ? <Text style={styles.reason}>Reason: {leave.reason}</Text> : null}
              {leave.rejection_reason ? <Text style={styles.reject}>Rejected: {leave.rejection_reason}</Text> : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.ink[100],
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.xl,
  },
  segment: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.white },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.ink[500] },
  segmentTextActive: { color: colors.primary[600] },
  label: { marginBottom: spacing.sm },
  typeRow: { gap: 8, marginBottom: spacing.lg },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink[200],
    backgroundColor: colors.white,
  },
  typeChipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  typeChipText: { fontSize: 13, fontWeight: '500', color: colors.ink[700] },
  typeChipTextActive: { color: colors.white },
  dateRow: { flexDirection: 'row', gap: spacing.md },
  dateField: { flex: 1 },
  halfDayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  checkboxTick: { color: colors.white, fontSize: 13, fontWeight: '700' },
  halfDayText: { fontSize: 14, color: colors.ink[700] },
  reasonInput: { minHeight: 80, textAlignVertical: 'top' },
  list: { gap: spacing.md },
  item: { paddingVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowMain: { gap: 2, flex: 1, paddingRight: spacing.md },
  event: { fontSize: 14, fontWeight: '600', color: colors.ink[800] },
  meta: { fontSize: 12, color: colors.ink[500] },
  reason: { marginTop: 6, fontSize: 12, color: colors.ink[500] },
  reject: { marginTop: 4, fontSize: 12, color: colors.primary[600] },
  empty: { fontSize: 14, color: colors.ink[500] },
});

export default LeaveScreen;
