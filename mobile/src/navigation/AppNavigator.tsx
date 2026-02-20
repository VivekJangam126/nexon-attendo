/**
 * App Navigator
 * Main navigation structure
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { AdminBlockedScreen } from '../screens/admin/AdminBlockedScreen';
import { DashboardScreen } from '../screens/employee/DashboardScreen';
import { MarkAttendanceScreen } from '../screens/employee/MarkAttendanceScreen';
import { HistoryScreen } from '../screens/employee/HistoryScreen';
import { ProfileScreen } from '../screens/employee/ProfileScreen';
import { ChangePasswordScreen } from '../screens/employee/ChangePasswordScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminBlocked"
          component={AdminBlockedScreen}
          options={{ headerShown: false }}
        />

        {/* Employee Screens */}
        <Stack.Screen
          name="EmployeeApp"
          component={DashboardScreen}
          options={{ title: 'Dashboard', headerLeft: () => null }}
        />
        <Stack.Screen
          name="MarkAttendance"
          component={MarkAttendanceScreen}
          options={{ title: 'Mark Attendance' }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'Attendance History' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ title: 'Change Password' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
