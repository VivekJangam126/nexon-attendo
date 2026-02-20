/**
 * Admin Blocked Screen
 * Shown when admin tries to use mobile app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/common/Button';
import { logout } from '../../services/auth.service';

interface AdminBlockedScreenProps {
  navigation: any;
}

export const AdminBlockedScreen: React.FC<AdminBlockedScreenProps> = ({ navigation }) => {
  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Admin Access</Text>
        <Text style={styles.message}>
          This mobile app is designed for employees only.
        </Text>
        <Text style={styles.submessage}>
          Please use the web admin panel to access admin features.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={handleLogout} variant="outline" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  submessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
  },
});
