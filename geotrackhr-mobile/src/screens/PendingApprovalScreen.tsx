import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Button } from '../components/ui/Button';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PendingApproval'>;

/**
 * Shown right after a successful self-registration. The employee record is
 * pending HR approval; there is no login account yet, so the only way
 * forward is back to the login screen.
 */
const PendingApprovalScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { email } = route.params;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>✓</Text>
      </View>
      <Text style={styles.title}>Registration submitted</Text>
      <Text style={styles.body}>
        Thanks for registering{email ? ` (${email})` : ''}. Your profile is now in the
        pending queue — HR will review and approve it before you can start
        checking in.
      </Text>
      <Text style={styles.hint}>When HR approves your registration, they'll share your login credentials.</Text>
      <View style={styles.spacer} />
      <Button title="Back to login" onPress={() => navigation.popToTop()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.success[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconText: { fontSize: 40, color: colors.success[600], fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink[900], textAlign: 'center' },
  body: { marginTop: spacing.md, fontSize: 14, color: colors.ink[600], textAlign: 'center', lineHeight: 21 },
  hint: { marginTop: spacing.md, fontSize: 12, color: colors.ink[500], textAlign: 'center' },
  spacer: { height: spacing.xxl },
});

export default PendingApprovalScreen;

