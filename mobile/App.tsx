/**
 * Main App Component
 * Entry point for Nexus Attendo Mobile
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Small delay to ensure all modules are loaded
        await new Promise(resolve => setTimeout(() => resolve(undefined), 100));
        
        // Import and log device info (non-blocking)
        try {
          const { logDeviceInfo } = await import('./src/services/device.service');
          logDeviceInfo().catch(console.error);
        } catch (err) {
          console.warn('Device service not available:', err);
        }

        setIsReady(true);
      } catch (err: any) {
        console.error('App initialization failed:', err);
        setError(err.message || 'Failed to initialize app');
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.errorTitle}>❌ Initialization Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>Try restarting the app</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading Nexus Attendo...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#e0e0e0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
