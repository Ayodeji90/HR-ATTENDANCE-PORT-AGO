import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { initSyncListener } from './services/syncManager';

/**
 * Entry point for the React Native application.
 * It wraps the navigation hierarchy in a NavigationContainer and
 * provides a SafeAreaProvider for proper handling of notches and status bars.
 * Also registers the global offline-queue sync listener so queued punches
 * flush automatically whenever the device comes back online.
 */
const App = () => {
  useEffect(() => initSyncListener(), []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
