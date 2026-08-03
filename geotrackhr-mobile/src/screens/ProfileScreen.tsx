import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/auth';
import { fetchMe } from '../services/employees';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { Employee } from '../types';
import { colors, radius, spacing, typography } from '../theme';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  hr: 'HR Manager',
  supervisor: 'Supervisor',
  employee: 'Employee',
};

const ProfileScreen = () => {
  const { user, refreshToken, clearAuth } = useAuthStore();
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchMe()
      .then(setEmployee)
      .catch(() => {});
  }, []);

  const handleLogout = useCallback(async () => {
    Alert.alert('Log out?', 'You will need to log in again to check in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          if (refreshToken) await logout(refreshToken);
          clearAuth();
        },
      },
    ]);
  }, [refreshToken, clearAuth]);

  const initials = (user?.fullName ?? user?.email ?? '?')
    .split(' ')
    .map((s) => s.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Screen title="Profile">
      <Card>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.fullName ?? '—'}</Text>
            <Text style={styles.role}>{user ? ROLE_LABELS[user.role] ?? user.role : ''}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <Text style={styles.fieldLabel}>Email</Text>
        <Text style={styles.fieldValue}>{user?.email ?? '—'}</Text>
        {employee ? (
          <>
            <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Employee code</Text>
            <Text style={styles.fieldValue}>{employee.employee_code}</Text>
            <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Department</Text>
            <Text style={styles.fieldValue}>{employee.department ?? '—'}</Text>
          </>
        ) : null}
      </Card>

      <Button title="Log out" variant="danger" onPress={handleLogout} style={{ marginTop: spacing.xl }} />
      <Text style={styles.version}>GeoTrackHR Mobile v1.0.0</Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink[900] },
  role: { marginTop: 2, fontSize: 13, color: colors.ink[500] },
  divider: { height: 1, backgroundColor: colors.ink[100], marginVertical: spacing.lg },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.ink[400], textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { marginTop: 2, fontSize: 14, color: colors.ink[800] },
  fieldSpacing: { marginTop: spacing.lg },
  version: { marginTop: spacing.xl, textAlign: 'center', fontSize: 11, color: colors.ink[400] },
});

export default ProfileScreen;
