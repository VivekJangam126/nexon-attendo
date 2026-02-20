/**
 * Splash Screen
 * Checks for existing session and auto-navigates
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getSession, getProfile } from '../../services/auth.service';

interface SplashScreenProps {
  navigation: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      console.log('🔍 Checking for existing session...');
      
      const { session, error } = await getSession();
      
      if (error || !session) {
        console.log('  ℹ️  No active session, navigating to login');
        setTimeout(() => {
          navigation.replace('Login');
        }, 1000);
        return;
      }
      
      console.log('  ✅ Session found, fetching profile...');
      
      const { profile, error: profileError } = await getProfile(session.user.id);
      
      if (profileError || !profile) {
        console.log('  ❌ Profile fetch failed, navigating to login');
        navigation.replace('Login');
        return;
      }
      
      console.log('  ✅ Profile loaded, navigating to app...');
      
      // Navigate based on role
      if (profile.role === 'employee') {
        if (profile.status === 'active') {
          navigation.replace('EmployeeApp', { profile });
        } else {
          navigation.replace('Login');
        }
      } else if (profile.role === 'admin') {
        navigation.replace('AdminBlocked');
      } else {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('  ❌ Session check failed:', error);
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>NA</Text>
        </View>
        <Text style={styles.title}>Nexus Attendo</Text>
        <Text style={styles.subtitle}>Employee Attendance</Text>
      </View>
      
      <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#2563eb',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  loader: {
    marginTop: 20,
  },
});
