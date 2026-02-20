/**
 * Location Service
 * Handles GPS permissions and location fetching
 */

import * as Location from 'expo-location';

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  error?: string;
}

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  error?: string;
}

/**
 * Request location permissions
 */
export const requestLocationPermission = async (): Promise<PermissionResult> => {
  try {
    console.log('📍 Requesting location permission...');
    
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      console.log('  ✅ Location permission granted');
      return { granted: true, canAskAgain };
    } else {
      console.log('  ❌ Location permission denied');
      return {
        granted: false,
        canAskAgain,
        error: 'Location permission is required to mark attendance',
      };
    }
  } catch (error) {
    console.error('  ❌ Error requesting permission:', error);
    return {
      granted: false,
      canAskAgain: false,
      error: 'Failed to request location permission',
    };
  }
};

/**
 * Check if location permission is granted
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Get current location with high accuracy
 */
export const getCurrentLocation = async (): Promise<LocationResult> => {
  try {
    console.log('📍 Getting current location...');
    
    // Check permission first
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      return {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        error: 'Location permission not granted',
      };
    }
    
    // Get location with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      timeInterval: 5000,
      distanceInterval: 0,
    });
    
    console.log('  ✅ Location obtained:');
    console.log('    Latitude:', location.coords.latitude);
    console.log('    Longitude:', location.coords.longitude);
    console.log('    Accuracy:', location.coords.accuracy, 'meters');
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 0,
    };
  } catch (error) {
    console.error('  ❌ Error getting location:', error);
    return {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      error: 'Failed to get location. Please ensure GPS is enabled.',
    };
  }
};

/**
 * Validate location accuracy
 * Returns true if accuracy is acceptable (< 150m)
 */
export const isAccuracyAcceptable = (accuracy: number): boolean => {
  const MAX_ACCURACY = 150; // meters
  return accuracy > 0 && accuracy <= MAX_ACCURACY;
};

/**
 * Get location with validation
 */
export const getValidatedLocation = async (): Promise<LocationResult> => {
  const location = await getCurrentLocation();
  
  if (location.error) {
    return location;
  }
  
  if (!isAccuracyAcceptable(location.accuracy)) {
    console.log('  ⚠️  Location accuracy too low:', location.accuracy, 'meters');
    return {
      ...location,
      error: `Location accuracy is too low (${Math.round(location.accuracy)}m). Please move to an open area with better GPS signal.`,
    };
  }
  
  return location;
};
