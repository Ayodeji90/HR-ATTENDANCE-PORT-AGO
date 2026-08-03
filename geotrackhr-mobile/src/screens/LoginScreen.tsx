import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../store/authStore';
import { login } from '../services/auth';
import { getErrorMessage } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      setAuth(data);
      // RootNavigator switches to Main automatically once accessToken is set.
    } catch (err) {
      Alert.alert('Login failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.brand}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>PA</Text>
        </View>
        <Text style={styles.appName}>Port-Ago</Text>
        <Text style={styles.tagline}>Geo-verified attendance for construction crews</Text>
      </View>

      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@company.com" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

      <Button title="Log in" onPress={handleLogin} loading={loading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to GeoTrackHR?</Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
          Register for an account
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 24, justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  appName: { fontSize: 26, fontWeight: '700', color: colors.ink[900] },
  tagline: { marginTop: 6, fontSize: 13, color: colors.ink[500], textAlign: 'center' },
  footer: { marginTop: spacing.xl, alignItems: 'center', gap: 4 },
  footerText: { fontSize: 13, color: colors.ink[500] },
  link: { fontSize: 14, fontWeight: '600', color: colors.primary[600] },
});

export default LoginScreen;

