import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';
import LeaveScreen from '../screens/LeaveScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme';

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Leave: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, string> = {
  Home: 'home',
  History: 'history',
  Leave: 'event-note',
  Notifications: 'notifications',
  Profile: 'person',
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.ink[400],
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name={ICONS[route.name] as any} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={AttendanceHistoryScreen} />
      <Tab.Screen name="Leave" component={LeaveScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
