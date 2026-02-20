/**
 * Profile Screen
 * Shows user info, account options, and logout (matches web version)
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { logout, getCurrentUser } from '../../services/auth.service';
import { getProfile } from '../../services/profile.service';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { UserProfile } from '../../types/auth';

interface ProfileScreenProps {
  navigation: any;
  route: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  const [profile, setProfile] = useState<UserProfile | null>(route.params?.profile || null);
  const [loading, setLoading] = useState(!profile);

  // Reload profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('👤 Profile screen focused, reloading data...');
      if (!profile) {
        loadProfile();
      }
    }, [])
  );

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const profileData = await getProfile(user.id);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      "Are you sure you want to sign out? You'll need to log in again to access your account.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#16a34a';
      case 'pending':
        return '#ea580c';
      case 'rejected':
      case 'blocked':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  if (loading || !profile) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header with Avatar */}
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getInitials(profile.full_name)}</Text>
          </View>
          <Text style={styles.headerName}>{profile.full_name}</Text>
          <Text style={styles.headerRole}>{profile.role}</Text>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { color: getStatusColor(profile.status) }]}>
              {getStatusDisplay(profile.status)}
            </Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFILE INFORMATION</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>👤</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{profile.full_name}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>✉️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>💼</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{profile.role}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>🛡️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Status</Text>
                <Text style={[styles.infoValue, { color: getStatusColor(profile.status) }]}>
                  {getStatusDisplay(profile.status)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>🏢</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Office Location</Text>
                <Text style={styles.infoValue}>
                  {profile.office_name || 'Not Assigned'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Text style={styles.iconText}>📅</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{formatDate(profile.created_at)}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Account Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <Card style={styles.optionsCard}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <Text style={styles.iconText}>🔒</Text>
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Change Password</Text>
                  <Text style={styles.optionSubtitle}>Update your account password</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Nexus Attendo v1.0.0</Text>
          <Text style={styles.versionText}>© 2024 Nexus Pvt Ltd</Text>
        </View>
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
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoCard: {
    padding: 0,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 68,
  },
  optionsCard: {
    padding: 0,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  chevron: {
    fontSize: 24,
    color: '#94a3b8',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    gap: 8,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  versionContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
});
