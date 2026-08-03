import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PendingApprovalScreen from '../screens/PendingApprovalScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PendingApproval: { email: string };
  Main: undefined; // Tab navigator container
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * RootNavigator decides which screens to show based on authentication state:
 * - Logged in (valid tokens) → the Main tab navigator.
 * - Logged out → the login/register flow, plus the pending-approval screen
 *   shown after a successful self-registration submission.
 */
const RootNavigator = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {accessToken ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
