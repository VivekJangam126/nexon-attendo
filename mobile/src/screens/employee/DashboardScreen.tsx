/**
 * Dashboard Screen
 * Main employee screen showing today's status and quick actions
 * Matches web version exactly
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTodayAttendance, getActiveWindow, isWindowOpen } from '../../services/attendance.service';
import { getCurrentUser } from '../../services/auth.service';
import { getProfile } from '../../services/profile.service';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { formatTimeIST, getTodayDateIST, formatDateFull } from '../../utils/dateFormatter';
import { Attendance, AttendanceWindow } from '../../types/attendance';
import { UserProfile } from '../../types/auth';

interface DashboardScreenProps {
  navigation: any;
  route: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, route }) => {
  const [profile, setProfile] = useState<UserProfile | null>(route.params?.profile || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [attendanceWindow, setAttendanceWindow] = useState<AttendanceWindow | null>(null);
  const [windowOpenStatus, setWindowOpenStatus] = useState(false);
  const [windowDisplay, setWindowDisplay] = useState('Loading...');

  // Load data when screen comes into focus or when refresh param changes
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Dashboard focused, reloading data...');
      loadData();
    }, [route.params?.refresh]) // Trigger when refresh param changes
  );

  const loadData = async () => {
    try {
      console.log('📊 Loading dashboard data...');
      
      // Always reload profile to get latest data including office_name
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const currentProfile = await getProfile(user.id);
      setProfile(currentProfile);

      console.log('📊 Dashboard profile data:', {
        name: currentProfile.full_name,
        office_location: currentProfile.office_location,
        office_name: currentProfile.office_name,
      });

      const [attendance, window, windowStatus] = await Promise.all([
        getTodayAttendance(currentProfile.id),
        getActiveWindow(),
        isWindowOpen(currentProfile),
      ]);
      
      console.log('✅ Dashboard data loaded:', {
        hasAttendance: !!attendance,
        windowOpen: windowStatus.isOpen,
        windowDisplay: windowStatus.windowDisplay
      });
      
      setTodayAttendance(attendance);
      setAttendanceWindow(window);
      setWindowOpenStatus(windowStatus.isOpen);
      setWindowDisplay(windowStatus.windowDisplay);
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const canMarkAttendance = !todayAttendance && windowOpenStatus;

  const handleMarkAttendance = () => {
    if (!canMarkAttendance) return;
    navigation.navigate('MarkAttendance', { profile });
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  if (!profile) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load profile</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{profile.full_name}</Text>
          </View>
        </View>
        <Text style={styles.date}>📅 {formatDateFull(getTodayDateIST())}</Text>
      </View>

      {/* Office Info Card */}
      {profile.office_name && (
        <Card style={styles.officeCard}>
          <View style={styles.officeContent}>
            <View style={styles.officeIcon}>
              <Text style={styles.officeIconText}>🏢</Text>
            </View>
            <View>
              <Text style={styles.officeLabel}>Current Office</Text>
              <Text style={styles.officeValue}>{profile.office_name}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Today's Attendance Card */}
      <Card style={styles.attendanceCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Attendance</Text>
          <View style={[
            styles.statusBadge,
            todayAttendance ? styles.statusBadgePresent : styles.statusBadgeNotMarked
          ]}>
            {todayAttendance && <Text style={styles.statusIcon}>✓</Text>}
            <Text style={styles.statusText}>
              {todayAttendance ? 'Present' : 'Not Marked'}
            </Text>
          </View>
        </View>

        {todayAttendance ? (
          <View style={styles.attendanceDetails}>
            <View style={styles.timeRow}>
              <Text style={styles.timeIcon}>🕐</Text>
              <Text style={styles.timeText}>
                Check-in: {formatTimeIST(todayAttendance.check_in_time)}
              </Text>
            </View>
            {todayAttendance.check_out_time ? (
              <View style={styles.timeRow}>
                <Text style={styles.timeIcon}>🕐</Text>
                <Text style={styles.timeText}>
                  Check-out: {formatTimeIST(todayAttendance.check_out_time)}
                </Text>
              </View>
            ) : (
              <View style={styles.timeRow}>
                <Text style={styles.timeIcon}>🕐</Text>
                <Text style={styles.timeText}>
                  Auto check-out at 6:00 PM
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Verification Status */}
        <View style={styles.verificationSection}>
          <View style={styles.verificationItem}>
            <View style={styles.verificationIcon}>
              <Text>📍</Text>
            </View>
            <View style={styles.verificationInfo}>
              <Text style={styles.verificationTitle}>Location</Text>
              <Text style={styles.verificationSubtitle}>GPS validation</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Info Message */}
      <View style={[
        styles.infoMessage,
        todayAttendance 
          ? styles.infoMessageSuccess 
          : windowOpenStatus 
            ? styles.infoMessageReady 
            : styles.infoMessageClosed
      ]}>
        {todayAttendance ? (
          <>
            <Text style={styles.infoTitle}>Attendance recorded successfully.</Text>
            <Text style={styles.infoSubtitle}>
              Your attendance for today has been marked.
            </Text>
          </>
        ) : windowOpenStatus ? (
          <>
            <Text style={styles.infoTitle}>Ready to mark attendance.</Text>
            <Text style={styles.infoSubtitle}>
              Attendance window: {windowDisplay}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.infoTitle}>⚠️ Attendance window is closed.</Text>
            <Text style={styles.infoSubtitle}>
              Window: {windowDisplay}
            </Text>
          </>
        )}
      </View>

      {/* Mark Attendance Button */}
      <TouchableOpacity
        style={[
          styles.markButton,
          !canMarkAttendance && styles.markButtonDisabled
        ]}
        onPress={handleMarkAttendance}
        disabled={!canMarkAttendance}
        activeOpacity={0.8}
      >
        <Text style={styles.markButtonText}>
          {todayAttendance ? '✓ Attendance Marked' : 'Mark Attendance'}
        </Text>
      </TouchableOpacity>

      {!canMarkAttendance && !todayAttendance && (
        <Text style={styles.buttonHint}>
          {windowOpenStatus 
            ? 'Attendance already marked for today' 
            : `Attendance window: ${windowDisplay}`
          }
        </Text>
      )}
    </ScrollView>
    <BottomNavigation />
  </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    paddingTop: 32,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  officeCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  officeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  officeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  officeIconText: {
    fontSize: 20,
  },
  officeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  officeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  attendanceCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgePresent: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeNotMarked: {
    backgroundColor: '#f1f5f9',
  },
  statusIcon: {
    fontSize: 14,
    color: '#16a34a',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  attendanceDetails: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#64748b',
  },
  verificationSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verificationInfo: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  verificationSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoMessage: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoMessageSuccess: {
    backgroundColor: '#dcfce7',
  },
  infoMessageReady: {
    backgroundColor: '#eff6ff',
  },
  infoMessageClosed: {
    backgroundColor: '#fef3c7',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  markButton: {
    marginHorizontal: 20,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  markButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
  },
  markButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  buttonHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
    marginHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});
