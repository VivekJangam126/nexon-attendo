/**
 * Mark Attendance Screen
 * Handles GPS location and attendance marking
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { markAttendance, getStrictMode } from '../../services/attendance.service';
import { requestLocationPermission, getValidatedLocation } from '../../services/location.service';
import { getDeviceIdentifier, getUserAgent } from '../../services/device.service';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getErrorMessage, getErrorTitle } from '../../utils/errorHandler';
import { UserProfile } from '../../types/auth';

interface MarkAttendanceScreenProps {
  navigation: any;
  route: any;
}

export const MarkAttendanceScreen: React.FC<MarkAttendanceScreenProps> = ({ navigation, route }) => {
  const profile: UserProfile = route.params?.profile;
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'permission' | 'location' | 'marking' | 'complete'>('permission');
  const [error, setError] = useState('');
  const [strictMode, setStrictMode] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const strict = await getStrictMode();
    setStrictMode(strict);
  };

  const handleMarkAttendance = async () => {
    setError('');
    setLoading(true);
    
    try {
      // Step 1: Check permission
      setStep('permission');
      
      if (strictMode) {
        const permission = await requestLocationPermission();
        
        if (!permission.granted) {
          setError(permission.error || 'Location permission is required');
          setLoading(false);
          return;
        }
      }
      
      // Step 2: Get location
      setStep('location');
      
      let latitude = 0;
      let longitude = 0;
      
      if (strictMode) {
        const location = await getValidatedLocation();
        
        if (location.error) {
          setError(location.error);
          setLoading(false);
          return;
        }
        
        latitude = location.latitude;
        longitude = location.longitude;
      }
      
      // Step 3: Mark attendance
      setStep('marking');
      
      const deviceId = await getDeviceIdentifier();
      const userAgent = getUserAgent();
      
      const result = await markAttendance(profile, latitude, longitude, deviceId, userAgent);
      
      if (!result.success) {
        setError(getErrorMessage(result.errorCode, result.error));
        setLoading(false);
        return;
      }
      
      // Success
      setStep('complete');
      setLoading(false);
      
      Alert.alert(
        'Success!',
        'Your attendance has been marked successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      console.error('Mark attendance error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case 'permission':
        return 'Checking permissions...';
      case 'location':
        return 'Getting your location...';
      case 'marking':
        return 'Recording attendance...';
      case 'complete':
        return 'Complete!';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>Mark Attendance</Text>
        <Text style={styles.subtitle}>
          {strictMode
            ? 'Location verification is required'
            : 'Location verification is optional'}
        </Text>

        {error && <ErrorMessage message={error} />}

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{getStepMessage()}</Text>
          </View>
        )}

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍</Text>
            <Text style={styles.infoText}>
              {strictMode
                ? 'GPS location will be verified'
                : 'GPS location is optional'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏢</Text>
            <Text style={styles.infoText}>
              {strictMode
                ? 'You must be within office premises'
                : 'You can mark from anywhere'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⏰</Text>
            <Text style={styles.infoText}>
              Attendance window must be open
            </Text>
          </View>
        </View>

        <Button
          title="Mark Attendance Now"
          onPress={handleMarkAttendance}
          loading={loading}
          disabled={loading}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  infoContainer: {
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
  },
});
