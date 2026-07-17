import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined; // Tab navigator container
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * RootNavigator decides which stack screen to show based on authentication state.
 * If the user is logged in (auth token present), it navigates directly to the Main tabs.
 * Otherwise it shows the authentication flow.
 */
const RootNavigator = () => {
  const { token } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
