/**
 * History Screen
 * Shows attendance history with filters
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { getAttendanceHistory } from '../../services/attendance.service';
import { getCurrentUser } from '../../services/auth.service';
import { getProfile } from '../../services/profile.service';
import { StatusBadge } from '../../components/attendance/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate, formatTimeIST } from '../../utils/dateFormatter';
import { Attendance } from '../../types/attendance';
import { UserProfile } from '../../types/auth';

interface HistoryScreenProps {
  route: any;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ route }) => {
  const [profile, setProfile] = useState<UserProfile | null>(route.params?.profile || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<Attendance[]>([]);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      // Get profile if not passed
      if (!profile) {
        const user = await getCurrentUser();
        if (user) {
          const profileData = await getProfile(user.id);
          setProfile(profileData);
        }
      }
      
      // Load history
      await loadHistory();
    } catch (error) {
      console.error('Error initializing history screen:', error);
      Alert.alert('Error', 'Failed to load history');
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const userId = profile?.id || (await getCurrentUser())?.id;
      if (userId) {
        const data = await getAttendanceHistory(userId, 30);
        setHistory(data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const renderItem = ({ item }: { item: Attendance }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.time}>Check-in: {formatTimeIST(item.check_in_time)}</Text>
      {item.check_out_time && (
        <Text style={styles.time}>Check-out: {formatTimeIST(item.check_out_time)}</Text>
      )}
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading history..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No attendance records found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  list: {
    padding: 20,
  },
  item: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  time: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
});
