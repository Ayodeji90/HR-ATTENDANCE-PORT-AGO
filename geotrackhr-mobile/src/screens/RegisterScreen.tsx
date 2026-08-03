import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { selfRegister } from '../services/auth';
import { getErrorMessage } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

/**
 * Self-registration for employees. Submits to POST /employees/register
 * (public). This creates a PENDING employee record — no login account — so
 * the employee is routed to the PendingApproval screen and must wait for HR
 * to approve before they can sign in.
 */
const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing details', 'First and last name are required.');
      return;
    }
    setLoading(true);
    try {
      await selfRegister({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
      });
      navigation.replace('PendingApproval', { email: email.trim() });
    } catch (err) {
      Alert.alert('Registration failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>
          Create your employee profile. Our HR team reviews every registration before you can sign in.
        </Text>

        <Input label="First name" value={firstName} onChangeText={setFirstName} placeholder="James" />
        <Input label="Last name" value={lastName} onChangeText={setLastName} placeholder="Wilson" />
        <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@company.com" />
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+1 555 000 0000" />
        <Input label="Department" value={department} onChangeText={setDepartment} placeholder="Civil Engineering" />
        <Input label="Designation" value={designation} onChangeText={setDesignation} placeholder="Site Engineer" />

        <Button title="Submit registration" onPress={handleRegister} loading={loading} />
        <Text style={styles.backLink} onPress={() => navigation.goBack()}>
          Already have an account? Log in
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink[900], marginTop: 8 },
  subtitle: { fontSize: 13, color: colors.ink[500], marginTop: 6, marginBottom: spacing.xl, lineHeight: 19 },
  backLink: { marginTop: spacing.lg, textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.primary[600] },
});

export default RegisterScreen;

