import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchCamera, CameraOptions } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { fetchSites } from '../services/sites';
import { fetchMe } from '../services/employees';
import { fetchAttendanceHistory, punchEndpoint } from '../services/attendance';
import { offlineStorage } from '../services/offlineStorage';
import { flushOfflineQueue } from '../services/syncManager';
import { getErrorMessage } from '../services/api';
import { useLocation } from '../hooks/useLocation';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import {
  currentAttendanceWindow,
  isLateCheckIn,
  WINDOW_ACTION,
  WINDOW_LABELS,
} from '../utils/attendanceWindows';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SiteSelector } from '../components/SiteSelector';
import type { AttendanceEventType, AttendanceRecord, Employee, Site } from '../types';
import { colors, radius, spacing, typography } from '../theme';

const ACTION_LABELS: Record<AttendanceEventType, string> = {
  check_in: 'Check In',
  afternoon_confirm: 'Confirm Afternoon',
  check_out: 'Check Out',
};

const ACTIONS: AttendanceEventType[] = ['check_in', 'afternoon_confirm', 'check_out'];

const HomeScreen = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState<AttendanceEventType | null>(null);
  const [reasonModal, setReasonModal] = useState<{ open: boolean; reason: string; coords: { latitude: number; longitude: number } }>({
    open: false,
    reason: '',
    coords: { latitude: 0, longitude: 0 },
  });
  // Live selfie: captured at punch time and sent with the punch. The backend
  // verifies it matches the employee's enrolled face before recording.
  const [selfie, setSelfie] = useState<string | null>(null);
  const [capturingSelfie, setCapturingSelfie] = useState(false);

  const { coords, loading: locating, error: locationError, refresh: refreshLocation } = useLocation();
  const { isOnline, isInternetReachable } = useNetworkStatus();
  const online = isOnline && isInternetReachable !== false;

  const loadData = useCallback(async () => {
    const [me, siteList, queue] = await Promise.all([
      fetchMe().catch(() => null),
      fetchSites().catch(() => []),
      offlineStorage.getQueue().catch(() => []),
    ]);
    if (me) setEmployee(me);
    setSites(siteList);
    setPendingCount(queue.length);
    if (me) {
      const history = await fetchAttendanceHistory(me.id).catch(() => []);
      setRecords(history);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (online && pendingCount > 0) {
      flushOfflineQueue().then(async (synced) => {
        if (synced > 0) {
          // Some items may have failed (e.g. still outside a time window) —
          // keep the count honest by reading back the remaining queue.
          const remaining = await offlineStorage.getQueue();
          setPendingCount(remaining.length);
          loadData();
        }
      });
    }
  }, [online, pendingCount, loadData]);
  const today = getLocalToday(); // fresh each render so it rolls over at midnight
  const todayRecords = useMemo(
    () => records.filter((r) => r.event_date === today),
    [records, today]
  );

  const window = currentAttendanceWindow();
  const recordFor = (type: AttendanceEventType): AttendanceRecord | undefined =>
    todayRecords.find((r) => r.event_type === type);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  /** Capture a live selfie with the front camera (base64 data URL). */
  const captureSelfie = useCallback(async () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      cameraType: 'front',
      saveToPhotos: false,
      includeBase64: true,
      quality: 0.6,
      maxWidth: 640,
      maxHeight: 640,
    };
    setCapturingSelfie(true);
    try {
      const response = await launchCamera(options);
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Camera unavailable', response.errorMessage ?? 'Could not open the camera.');
        return;
      }
      const asset = response.assets?.[0];
      if (!asset?.base64) {
        Alert.alert('Capture failed', 'No image was captured. Try again.');
        return;
      }
      const mime = asset.type ?? 'image/jpeg';
      setSelfie(`data:${mime};base64,${asset.base64}`);
    } finally {
      setCapturingSelfie(false);
    }
  }, []);

  /** Shared punch pipeline: site → GPS → selfie → (reason) → API or offline queue */
  const handleAction = async (eventType: AttendanceEventType) => {
    if (!selectedSite) {
      Alert.alert('Select a site', 'Choose where you are working before punching.');
      return;
    }
    if (!selfie) {
      Alert.alert('Selfie required', 'Take a live selfie so we can verify it is really you punching.');
      return;
    }
    const position = await refreshLocation();
    if (!position) {
      Alert.alert('Location unavailable', locationError ?? 'Unable to get your GPS position. Try again.');
      return;
    }

    if (eventType === 'check_in' && isLateCheckIn()) {
      setReasonModal({ open: true, reason: '', coords: position });
      return;
    }
    await performPunch(eventType, position.latitude, position.longitude, undefined);
  };

  const performPunch = async (
    eventType: AttendanceEventType,
    latitude: number,
    longitude: number,
    reason?: string
  ) => {
    if (!selectedSite) return;
    setSubmitting(eventType);
    try {
      if (!online) {
        await offlineStorage.enqueue({
          event_type: eventType,
          site_id: selectedSite.id,
          site_name: selectedSite.name,
          latitude,
          longitude,
          reason,
          selfie: selfie ?? undefined,
          client_timestamp: new Date().toISOString(),
        });
        setPendingCount((c) => c + 1);
        Alert.alert(
          'Saved offline',
          "You're offline, so your punch was saved on this device (selfie included). It will sync and verify when you're back online."
        );
        setSelfie(null);
        return;
      }
      await punchEndpoint[eventType]({ site_id: selectedSite.id, latitude, longitude, reason, selfie: selfie ?? undefined });
      Alert.alert('Success', `${ACTION_LABELS[eventType]} recorded — face verified at ${selectedSite.name}.`);
      setSelfie(null);
      loadData();
    } catch (err) {
      const code = (err as any)?.response?.data?.error?.code;
      if (code === 'FACIAL_MISMATCH') {
        Alert.alert(
          `${ACTION_LABELS[eventType]} failed`,
          'Face does not match the enrolled employee — only the registered person can punch.'
        );
      } else if (code === 'FACIAL_NOT_ENROLLED') {
        Alert.alert(
          `${ACTION_LABELS[eventType]} failed`,
          'No face enrolled for your account — ask HR to register your face before punching.'
        );
      } else if (code === 'NO_FACE_DETECTED') {
        Alert.alert(
          `${ACTION_LABELS[eventType]} failed`,
          'No face detected in the selfie — retake facing the camera.'
        );
      } else {
        Alert.alert(`${ACTION_LABELS[eventType]} failed`, getErrorMessage(err));
      }
    } finally {
      setSubmitting(null);
    }
  };

  const submitLateReason = async () => {
    const { reason, coords } = reasonModal;
    setReasonModal((m) => ({ ...m, open: false }));
    await performPunch('check_in', coords.latitude, coords.longitude, reason.trim() || undefined);
  };

  return (
    <Screen
      title={`Hello, ${employee ? employee.first_name : 'there'} 👋`}
      subtitle={employee ? `${employee.designation ?? 'Crew member'} · ${employee.employee_code}` : undefined}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Connectivity banner */}
      {!online ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Offline — punches will be queued and synced when you're back online
          </Text>
        </View>
      ) : null}

      {/* Today's status */}
      <Card title="Today's attendance">
        <View style={styles.statusRow}>
          {ACTIONS.map((type) => {
            const rec = recordFor(type);
            return (
              <View key={type} style={styles.statusItem}>
                <Text style={styles.statusLabel}>{ACTION_LABELS[type]}</Text>
                {rec ? (
                  <Badge
                    label={rec.status === 'approved' ? 'Approved' : rec.status === 'pending' ? 'Pending approval' : 'Rejected'}
                    tone={rec.status === 'approved' ? 'success' : rec.status === 'pending' ? 'warning' : 'danger'}
                  />
                ) : (
                  <Text style={styles.statusMissing}>Not yet</Text>
                )}
              </View>
            );
          })}
        </View>
      </Card>

      {/* Site selector */}
      <View style={styles.section}>
        <Text style={typography.section}>Your site</Text>
        <Text style={typography.small}>The geofence we verify your GPS against.</Text>
      </View>
      <SiteSelector sites={sites} selectedId={selectedSite?.id ?? null} onSelect={setSelectedSite} />

      {/* Punch actions */}
      <View style={styles.section}>
        <Text style={typography.section}>Punch in / out</Text>
        <Text style={typography.small}>
          Current window: {WINDOW_LABELS[window]}
          {coords ? ` · GPS ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` : ' · GPS pending'}
        </Text>
      </View>

      <View style={styles.actions}>
        {ACTIONS.map((type) => {
          const active = WINDOW_ACTION[window] === type;
          const done = !!recordFor(type);
          return (
            <Button
              key={type}
              title={ACTION_LABELS[type]}
              variant={active ? 'primary' : 'secondary'}
              disabled={done || locating}
              loading={submitting === type}
              style={styles.actionButton}
              onPress={() => handleAction(type)}
            />
          );
        })}
      </View>
      <Text style={styles.windowHint}>
        {activeActionLabel(window)} Window: {WINDOW_LABELS[window]}. Your GPS must be inside the site's geofence.
      </Text>

      {/* Live selfie verification */}
      <View style={styles.section}>
        <Text style={typography.section}>Live selfie</Text>
        <Text style={typography.small}>
          Capture a live photo of yourself — it's verified against your enrolled face before the punch is accepted.
        </Text>
      </View>
      {selfie ? (
        <View style={styles.selfieRow}>
          <Image source={{ uri: selfie }} style={styles.selfieThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selfieOk}>✓ Selfie captured</Text>
            <Button title="Re-take" variant="outline" onPress={captureSelfie} loading={capturingSelfie} />
          </View>
        </View>
      ) : (
        <Button
          title="Take live selfie"
          variant={submitting ? 'secondary' : 'primary'}
          onPress={captureSelfie}
          loading={capturingSelfie}
        />
      )}

      {/* Late check-in reason modal */}
      <Modal visible={reasonModal.open} transparent animationType="fade" onRequestClose={() => setReasonModal((m) => ({ ...m, open: false }))}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Late check-in</Text>
            <Text style={styles.modalBody}>
              It's after 9:15 AM. Add a reason — your check-in will be flagged for HR approval.
            </Text>
            <TextInput
              value={reasonModal.reason}
              onChangeText={(reason) => setReasonModal((m) => ({ ...m, reason }))}
              placeholder="Why are you late?"
              placeholderTextColor={colors.ink[300]}
              style={styles.modalInput}
              multiline
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" variant="outline" onPress={() => setReasonModal((m) => ({ ...m, open: false }))} style={styles.modalButton} />
              <Button title="Submit" onPress={submitLateReason} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>

    </Screen>
  );
}

function activeActionLabel(window: ReturnType<typeof currentAttendanceWindow>): string {
  const action = WINDOW_ACTION[window];
  return action ? ACTION_LABELS[action] : 'No';
}

function getLocalToday(): string {
  // Local calendar date (YYYY-MM-DD) — records are keyed by the site
  // timezone, so prefer the device's local date over UTC.
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: colors.warning[100],
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  offlineText: { fontSize: 13, color: colors.warning[600], textAlign: 'center' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { alignItems: 'flex-start', gap: 6, flex: 1 },
  statusLabel: { fontSize: 12, fontWeight: '600', color: colors.ink[500] },
  statusMissing: { fontSize: 13, color: colors.ink[400], fontWeight: '500' },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm },
  actions: { gap: spacing.md, marginTop: spacing.sm },
  actionButton: { width: '100%' },
  windowHint: { marginTop: spacing.lg, fontSize: 12, color: colors.ink[500], lineHeight: 18 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(19,19,20,0.55)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.ink[900] },
  modalBody: { marginTop: 6, fontSize: 13, color: colors.ink[600], lineHeight: 19 },
  modalInput: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ink[200],
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    fontSize: 14,
    color: colors.ink[900],
    textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalButton: { flex: 1 },
  selfieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  selfieThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.ink[100],
  },
  selfieOk: { fontSize: 14, fontWeight: '600', color: colors.success[600], marginBottom: 8 },
});

export default HomeScreen;
