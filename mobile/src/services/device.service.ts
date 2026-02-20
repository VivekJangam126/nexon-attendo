/**
 * Device Service
 * Handles device information and tracking
 */

import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getDeviceId } from '../utils/storage';

/**
 * Get device ID (persistent UUID)
 */
export const getDeviceIdentifier = async (): Promise<string> => {
  return await getDeviceId();
};

/**
 * Build user agent string from device info
 * Format: "Nexus-Attendo-Mobile/1.0.0 (Android 13; Samsung SM-G998B)"
 */
export const getUserAgent = (): string => {
  const appVersion = '1.0.0';
  const osVersion = Platform.Version;
  const deviceModel = Device.modelName || 'Unknown';
  const osName = Platform.OS === 'android' ? 'Android' : 'iOS';
  
  return `Nexus-Attendo-Mobile/${appVersion} (${osName} ${osVersion}; ${deviceModel})`;
};

/**
 * Get detailed device information
 */
export const getDeviceInfo = () => {
  return {
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    modelName: Device.modelName,
    modelId: Device.modelId,
    osName: Device.osName,
    osVersion: Device.osVersion,
    platform: Platform.OS,
    platformVersion: Platform.Version,
  };
};

/**
 * Log device info for debugging
 */
export const logDeviceInfo = async () => {
  const deviceId = await getDeviceIdentifier();
  const userAgent = getUserAgent();
  const info = getDeviceInfo();
  
  console.log('📱 Device Information:');
  console.log('  Device ID:', deviceId);
  console.log('  User Agent:', userAgent);
  console.log('  Brand:', info.brand);
  console.log('  Model:', info.modelName);
  console.log('  OS:', info.osName, info.osVersion);
  console.log('  Platform:', info.platform, info.platformVersion);
};
