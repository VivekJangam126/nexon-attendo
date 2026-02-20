/**
 * Debug App Component
 * Tests each import step-by-step to identify the failing module
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Test imports one by one
let testResults: { [key: string]: string } = {};

// Test 1: Basic React Native
testResults['React Native'] = '✅ Working';

// Test 2: Expo Status Bar
try {
  testResults['Expo Status Bar'] = '✅ Working';
} catch (e) {
  testResults['Expo Status Bar'] = `❌ Failed: ${e}`;
}

// Test 3: AsyncStorage
try {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  testResults['AsyncStorage'] = '✅ Working';
} catch (e: any) {
  testResults['AsyncStorage'] = `❌ Failed: ${e.message}`;
}

// Test 4: Expo Constants
try {
  const Constants = require('expo-constants');
  testResults['Expo Constants'] = '✅ Working';
} catch (e: any) {
  testResults['Expo Constants'] = `❌ Failed: ${e.message}`;
}

// Test 5: Expo Device
try {
  const Device = require('expo-device');
  testResults['Expo Device'] = '✅ Working';
} catch (e: any) {
  testResults['Expo Device'] = `❌ Failed: ${e.message}`;
}

// Test 6: Expo Location
try {
  const Location = require('expo-location');
  testResults['Expo Location'] = '✅ Working';
} catch (e: any) {
  testResults['Expo Location'] = `❌ Failed: ${e.message}`;
}

// Test 7: Supabase
try {
  const { createClient } = require('@supabase/supabase-js');
  testResults['Supabase'] = '✅ Working';
} catch (e: any) {
  testResults['Supabase'] = `❌ Failed: ${e.message}`;
}

// Test 8: React Navigation
try {
  const { NavigationContainer } = require('@react-navigation/native');
  testResults['React Navigation'] = '✅ Working';
} catch (e: any) {
  testResults['React Navigation'] = `❌ Failed: ${e.message}`;
}

// Test 9: React Navigation Stack
try {
  const { createNativeStackNavigator } = require('@react-navigation/native-stack');
  testResults['Navigation Stack'] = '✅ Working';
} catch (e: any) {
  testResults['Navigation Stack'] = `❌ Failed: ${e.message}`;
}

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🔍 Module Debug Test</Text>
        <Text style={styles.subtitle}>Testing each dependency...</Text>
        
        {Object.entries(testResults).map(([module, result]) => (
          <View key={module} style={styles.testItem}>
            <Text style={styles.moduleName}>{module}:</Text>
            <Text style={styles.result}>{result}</Text>
          </View>
        ))}
        
        <Text style={styles.footer}>
          If all tests pass, the issue is in the app logic, not dependencies.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  testItem: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  result: {
    fontSize: 13,
    color: '#cbd5e1',
    fontFamily: 'monospace',
  },
  footer: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
