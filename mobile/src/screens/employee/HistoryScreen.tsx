/**
 * History Screen
 * Shows attendance history with filters and stats (matches web version)
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAttendanceHistory } from '../../services/attendance.service';
import { getCurrentUser } from '../../services/auth.service';
import { getProfile } from '../../services/profile.service';
import { StatusBadge } from '../../components/attendance/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { formatTimeIST, getTodayDateIST } from '../../utils/dateFormatter';
import { Attendance } from '../../types/attendance';
import { UserProfile } from '../../types/auth';

interface HistoryScreenProps {
  route: any;
}

type DateRange = 'week' | 'month';
type StatusFilter = 'all' | 'present' | 'late' | 'absent';

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ route }) => {
  const [profile, setProfile] = useState<UserProfile | null>(route.params?.profile || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allRecords, setAllRecords] = useState<Attendance[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Attendance[]>([]);
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📜 History screen focused, reloading data...');
      initializeScreen();
    }, [])
  );

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
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const userId = profile?.id || (await getCurrentUser())?.id;
      if (userId) {
        const data = await getAttendanceHistory(userId, 30);
        
        // Fill missing dates with "absent" status
        const filledData = fillMissingDates(data, 30, userId);
        
        console.log('📊 Loaded history:', data.length, 'records');
        console.log('📊 Filled history:', filledData.length, 'records');
        
        setAllRecords(filledData);
        applyFilters(filledData, dateRange, statusFilter);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Fill in missing dates with "absent" status
   */
  const fillMissingDates = (records: Attendance[], days: number, userId: string): Attendance[] => {
    // Get current date in IST
    const today = getTodayDateIST();
    const todayDate = new Date(today + 'T00:00:00');
    
    // Create a map of existing records by date
    const recordMap = new Map<string, Attendance>();
    records.forEach(record => {
      const normalizedDate = record.date.split('T')[0];
      recordMap.set(normalizedDate, record);
    });
    
    // Generate all dates for the last N days
    const allRecords: Attendance[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      if (recordMap.has(dateString)) {
        allRecords.push(recordMap.get(dateString)!);
      } else {
        // Create absent record
        allRecords.push({
          id: `absent-${dateString}`,
          user_id: userId,
          date: dateString,
          check_in_time: null,
          check_out_time: null,
          status: 'absent',
          office_id: '',
          created_at: dateString,
          updated_at: dateString,
        } as Attendance);
      }
    }
    
    return allRecords;
  };

  /**
   * Apply filters to records
   */
  const applyFilters = (records: Attendance[], range: DateRange, status: StatusFilter) => {
    let filtered = [...records];
    
    // Apply date range filter
    const days = range === 'week' ? 7 : 30;
    filtered = filtered.slice(0, days);
    
    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(record => record.status === status);
    }
    
    setFilteredRecords(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleDateRangeChange = (value: DateRange) => {
    setDateRange(value);
    applyFilters(allRecords, value, statusFilter);
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    applyFilters(allRecords, dateRange, value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date(getTodayDateIST() + 'T00:00:00');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    }
  };

  // Calculate stats from date range
  const days = dateRange === 'week' ? 7 : 30;
  const dateRangeRecords = allRecords.slice(0, days);
  const presentCount = dateRangeRecords.filter(r => r.status === 'present').length;
  const lateCount = dateRangeRecords.filter(r => r.status === 'late').length;
  const absentCount = dateRangeRecords.filter(r => r.status === 'absent').length;

  const renderItem = ({ item }: { item: Attendance }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <View style={styles.itemLeft}>
          <View style={[
            styles.statusIcon,
            item.status === 'present' && styles.statusIconPresent,
            item.status === 'late' && styles.statusIconLate,
            item.status === 'absent' && styles.statusIconAbsent,
          ]}>
            <Text style={styles.statusIconText}>
              {item.status === 'present' ? '✓' : item.status === 'late' ? '⚠' : '✕'}
            </Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.date}>{formatDate(item.date)}</Text>
            {item.status === 'absent' ? (
              <Text style={styles.timeAbsent}>No attendance marked</Text>
            ) : (
              <View>
                {item.check_in_time && (
                  <Text style={styles.time}>In: {formatTimeIST(item.check_in_time)}</Text>
                )}
                {item.check_out_time && (
                  <Text style={styles.time}>Out: {formatTimeIST(item.check_out_time)}</Text>
                )}
              </View>
            )}
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading history..." />;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>
            {dateRange === 'week' ? 'Last 7 days' : 'Last 30 days'} summary
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
              <Text style={styles.statSubLabel}>On time</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.statValueWarning]}>{lateCount}</Text>
              <Text style={styles.statLabel}>Late</Text>
              <Text style={styles.statSubLabel}>After grace</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.statValueDanger]}>{absentCount}</Text>
              <Text style={styles.statLabel}>Absent</Text>
              <Text style={styles.statSubLabel}>Not marked</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersLabel}>Filters:</Text>
          
          {/* Date Range Filter */}
          <View style={styles.filterGroup}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                dateRange === 'week' && styles.filterButtonActive
              ]}
              onPress={() => handleDateRangeChange('week')}
            >
              <Text style={[
                styles.filterButtonText,
                dateRange === 'week' && styles.filterButtonTextActive
              ]}>
                Last Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                dateRange === 'month' && styles.filterButtonActive
              ]}
              onPress={() => handleDateRangeChange('month')}
            >
              <Text style={[
                styles.filterButtonText,
                dateRange === 'month' && styles.filterButtonTextActive
              ]}>
                Last Month
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Status Filter */}
          <View style={styles.filterGroup}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                styles.filterButtonSmall,
                statusFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => handleStatusFilterChange('all')}
            >
              <Text style={[
                styles.filterButtonText,
                styles.filterButtonTextSmall,
                statusFilter === 'all' && styles.filterButtonTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                styles.filterButtonSmall,
                statusFilter === 'present' && styles.filterButtonActive
              ]}
              onPress={() => handleStatusFilterChange('present')}
            >
              <Text style={[
                styles.filterButtonText,
                styles.filterButtonTextSmall,
                statusFilter === 'present' && styles.filterButtonTextActive
              ]}>
                Present
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                styles.filterButtonSmall,
                statusFilter === 'late' && styles.filterButtonActive
              ]}
              onPress={() => handleStatusFilterChange('late')}
            >
              <Text style={[
                styles.filterButtonText,
                styles.filterButtonTextSmall,
                statusFilter === 'late' && styles.filterButtonTextActive
              ]}>
                Late
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                styles.filterButtonSmall,
                statusFilter === 'absent' && styles.filterButtonActive
              ]}
              onPress={() => handleStatusFilterChange('absent')}
            >
              <Text style={[
                styles.filterButtonText,
                styles.filterButtonTextSmall,
                statusFilter === 'absent' && styles.filterButtonTextActive
              ]}>
                Absent
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Records List */}
        <FlatList
          data={filteredRecords}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>
                {statusFilter !== 'all' ? 'No Records Found' : 'No Records Yet'}
              </Text>
              <Text style={styles.emptyText}>
                {statusFilter !== 'all' 
                  ? 'Try changing your filters' 
                  : 'Your attendance history will appear here'}
              </Text>
            </View>
          }
        />
      </View>
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
  statsContainer: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statsTitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  statValueWarning: {
    color: '#ea580c',
  },
  statValueDanger: {
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  filtersContainer: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filtersLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '600',
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  filterButtonSmall: {
    flex: 0,
    minWidth: 60,
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  filterButtonTextSmall: {
    fontSize: 11,
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: 20,
    paddingBottom: 100,
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
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconPresent: {
    backgroundColor: '#dcfce7',
  },
  statusIconLate: {
    backgroundColor: '#fed7aa',
  },
  statusIconAbsent: {
    backgroundColor: '#fee2e2',
  },
  statusIconText: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemInfo: {
    flex: 1,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  timeAbsent: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  empty: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
