import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';

/**
 * Entry point for the React Native application.
 * It wraps the navigation hierarchy in a NavigationContainer and
 * provides a SafeAreaProvider for proper handling of notches and status bars.
 */
const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
