/**
 * Minimal Test App
 * To isolate the loading issue
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Nexus Attendo Mobile</Text>
      <Text style={styles.subtext}>Test Mode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtext: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
});
