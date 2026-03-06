/**
 * Login Screen
 * Email/password authentication
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { login, getProfile } from '../../services/auth.service';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const { user, error: loginError } = await login(email, password);
      
      if (loginError) {
        const errorMsg = loginError.message.toLowerCase();
        
        // Handle JWT/token errors (time sync issues)
        if (errorMsg.includes('jwt') || errorMsg.includes('token') || errorMsg.includes('expired')) {
          setError('Login failed. Please ensure your device date and time are correct and synced with network time.');
          setLoading(false);
          return;
        }
        
        setError(loginError.message);
        setLoading(false);
        return;
      }
      
      if (!user) {
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }
      
      // Fetch profile
      const { profile, error: profileError } = await getProfile(user.id);
      
      if (profileError || !profile) {
        setError('Failed to load profile. Please try again.');
        setLoading(false);
        return;
      }
      
      setLoading(false);
      
      // Navigate based on role and status
      if (profile.role === 'employee') {
        if (profile.status === 'active') {
          // Check if password reset is required
          if (profile.password_reset_required) {
            navigation.replace('ChangePassword');
          } else {
            navigation.replace('EmployeeApp', { profile });
          }
        } else if (profile.status === 'pending') {
          setError('Your account is pending approval. Please wait for admin approval.');
        } else if (profile.status === 'blocked' || profile.status === 'rejected') {
          setError('Your account has been blocked. Please contact HR.');
        }
      } else if (profile.role === 'admin') {
        navigation.replace('AdminBlocked');
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>NA</Text>
          </View>
          <Text style={styles.title}>Employee Login</Text>
          <Text style={styles.subtitle}>Sign in to mark your attendance</Text>
        </View>

        {/* Error Message */}
        {error ? <ErrorMessage message={error} /> : null}

        {/* Login Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Nexus Pvt Ltd</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 64,
    height: 64,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  form: {
    marginBottom: 24,
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
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  eyeText: {
    fontSize: 20,
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 20,
  },
});
