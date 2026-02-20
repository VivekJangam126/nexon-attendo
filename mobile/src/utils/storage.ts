/**
 * AsyncStorage Utilities
 * Handles device ID and other persistent data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@nexus_attendo:device_id';
const USER_PREFERENCES_KEY = '@nexus_attendo:preferences';

/**
 * Generate a simple UUID v4
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Get or generate device ID
 * Device ID persists across app sessions
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate new UUID for this device
      deviceId = generateUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('📱 Generated new device ID:', deviceId);
    } else {
      console.log('📱 Retrieved existing device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('❌ Error getting device ID:', error);
    // Fallback to temporary UUID if storage fails
    return generateUUID();
  }
};

/**
 * Clear device ID (for testing/debugging)
 */
export const clearDeviceId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    console.log('🗑️  Device ID cleared');
  } catch (error) {
    console.error('❌ Error clearing device ID:', error);
  }
};

/**
 * Store user preferences
 */
export const storePreferences = async (preferences: Record<string, any>): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('❌ Error storing preferences:', error);
  }
};

/**
 * Get user preferences
 */
export const getPreferences = async (): Promise<Record<string, any> | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Error getting preferences:', error);
    return null;
  }
};

/**
 * Clear all app data (logout cleanup)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([USER_PREFERENCES_KEY]);
    // Note: We keep device_id even after logout
    console.log('🗑️  App data cleared');
  } catch (error) {
    console.error('❌ Error clearing app data:', error);
  }
};
