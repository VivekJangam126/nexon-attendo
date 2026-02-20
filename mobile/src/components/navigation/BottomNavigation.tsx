/**
 * Bottom Navigation Component
 * Navigation bar at the bottom of employee screens
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

interface NavItem {
  icon: string;
  label: string;
  screen: string;
}

export const BottomNavigation: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const navItems: NavItem[] = [
    { icon: '🏠', label: 'Dashboard', screen: 'EmployeeApp' },
    { icon: '🕐', label: 'History', screen: 'History' },
    { icon: '👤', label: 'Profile', screen: 'Profile' },
  ];

  const isActive = (screen: string) => route.name === screen;

  const handlePress = (screen: string) => {
    navigation.navigate(screen as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[
              styles.navItem,
              isActive(item.screen) && styles.navItemActive,
            ]}
            onPress={() => handlePress(item.screen)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.icon,
              isActive(item.screen) && styles.iconActive,
            ]}>
              {item.icon}
            </Text>
            <Text style={[
              styles.label,
              isActive(item.screen) && styles.labelActive,
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state styling handled by icon and label
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  labelActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
