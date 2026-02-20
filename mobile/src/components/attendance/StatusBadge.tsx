/**
 * Status Badge Component
 * Shows attendance status with color coding
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AttendanceStatus } from '../../types/attendance';

interface StatusBadgeProps {
  status: AttendanceStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'present':
        return {
          label: 'Present',
          backgroundColor: '#dcfce7',
          textColor: '#166534',
        };
      case 'late':
        return {
          label: 'Late',
          backgroundColor: '#fef3c7',
          textColor: '#92400e',
        };
      case 'absent':
        return {
          label: 'Absent',
          backgroundColor: '#fee2e2',
          textColor: '#991b1b',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.textColor }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
