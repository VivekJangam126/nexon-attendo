/**
 * Dashboard Screen
 * Main employee screen showing today's status and quick actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTodayAttendance, getActiveWindow } from '../../services/attendance.service';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/attendance/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatTimeIST, getTodayDateIST, formatDateFull } from '../../utils/dateFormatter';
import { Attendance, AttendanceWindow } from '../../types/attendance';
import { UserProfile } from '../../types/auth';

interface DashboardScreenProps {
  navigation: any;
  route: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, route }) => {
  const profile: UserProfile = route.params?.profile;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [attendanceWindow, setAttendanceWindow] = useState<AttendanceWindow | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [attendance, window] = await Promise.all([
        getTodayAttendance(profile.id),
        getActiveWindow(),
      ]);
      
      setTodayAttendance(attendance);
      setAttendanceWindow(window);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatWindowTime = (window: AttendanceWindow) => {
    const formatTime = (timeString: string) => {
      const [hour, minute] = timeString.split(':').map(Number);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    };
    return `${formatTime(window.start_time)} - ${formatTime(window.end_time)}`;
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{profile.full_name}</Text>
        <Text style={styles.date}>{formatDateFull(getTodayDateIST())}</Text>
      </View>

      {/* Today's Attendance Card */}
      <Card style={styles.attendanceCard}>
        <Text style={styles.cardTitle}>Today's Attendance</Text>
        
        {todayAttendance ? (
          <View>
            <View style={styles.statusRow}>
              <StatusBadge status={todayAttendance.status} />
              <Text style={styles.checkInTime}>
                {formatTimeIST(todayAttendance.check_in_time)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Check-in:</Text>
              <Text style={styles.infoValue}>
                {formatTimeIST(todayAttendance.check_in_time)}
              </Text>
            </View>
            
            {todayAttendance.check_out_time && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Check-out:</Text>
                <Text style={styles.infoValue}>
                  {formatTimeIST(todayAttendance.check_out_time)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.notMarkedContainer}>
            <Text style={styles.notMarkedIcon}>📍</Text>
            <Text style={styles.notMarkedText}>Not marked yet</Text>
            <Text style={styles.notMarkedSubtext}>
              Mark your attendance to get started
            </Text>
          </View>
        )}
      </Card>

      {/* Mark Attendance Button */}
      {!todayAttendance && (
        <TouchableOpacity
          style={styles.markButton}
          onPress={() => navigation.navigate('MarkAttendance')}
          activeOpacity={0.8}
        >
          <Text style={styles.markButtonText}>📍 Mark Attendance</Text>
        </TouchableOpacity>
      )}

      {/* Attendance Window Info */}
      {attendanceWindow && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Attendance Window</Text>
          <Text style={styles.infoCardValue}>{formatWindowTime(attendanceWindow)}</Text>
          {attendanceWindow.grace_period_minutes > 0 && (
            <Text style={styles.infoCardSubtext}>
              Grace period: {attendanceWindow.grace_period_minutes} minutes
            </Text>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.actionIcon}>👤</Text>
          <Text style={styles.actionText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  date: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  attendanceCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkInTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  notMarkedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  notMarkedIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  notMarkedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  notMarkedSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  markButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  markButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoCard: {
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  infoCardSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
});
