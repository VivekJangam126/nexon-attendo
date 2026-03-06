/**
 * Change Password Screen
 * Allows users to update their password
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { authService } from '../../services/auth.service';
import { getProfile } from '../../services/profile.service';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ErrorMessage } from '../../components/common/ErrorMessage';

interface ChangePasswordScreenProps {
  navigation: any;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordResetRequired, setIsPasswordResetRequired] = useState(false);

  // Check if password reset is required
  useEffect(() => {
    const checkPasswordResetStatus = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          const profile = await getProfile(user.id);
          if (profile?.password_reset_required) {
            setIsPasswordResetRequired(true);
          }
        }
      } catch (err) {
        console.error('Error checking password reset status:', err);
      }
    };

    checkPasswordResetStatus();
  }, []);

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.changePassword(currentPassword, newPassword);

      if (result.success) {
        Alert.alert(
          'Password Changed',
          'Your password has been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (isPasswordResetRequired) {
                  // Navigate to dashboard if password reset was required
                  navigation.navigate('Dashboard');
                } else {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        setError(result.error?.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>
            {isPasswordResetRequired 
              ? 'Your administrator has reset your password. Please create a new password to continue.'
              : 'Update your account password'
            }
          </Text>

          {/* Password Reset Required Notice */}
          {isPasswordResetRequired && (
            <View style={styles.noticeContainer}>
              <Text style={styles.noticeTitle}>Password Reset Required</Text>
              <Text style={styles.noticeText}>
                Please use the temporary password provided by your administrator and create a new password.
              </Text>
            </View>
          )}

          {error && <ErrorMessage message={error} />}

          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {isPasswordResetRequired ? 'Temporary Password' : 'Current Password'}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder={isPasswordResetRequired ? 'Enter temporary password' : 'Enter current password'}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrent(!showCurrent)}
              >
                <Text style={styles.eyeIcon}>{showCurrent ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min. 8 characters"
                secureTextEntry={!showNew}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNew(!showNew)}
              >
                <Text style={styles.eyeIcon}>{showNew ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Text style={styles.eyeIcon}>{showConfirm ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Update Password"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </Card>
      </ScrollView>
    </View>
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
    marginBottom: 24,
  },
  noticeContainer: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#1e40af',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
});