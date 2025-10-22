import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '../components';
import { theme } from '../theme';
import { useStore } from '../store';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', collegeId: '' });

  const login = useStore((state) => state.login);

  const validateForm = (): boolean => {
    const newErrors = { email: '', collegeId: '' };
    let isValid = true;

    if (!email || !email.includes('@')) {
      newErrors.email = 'Please enter a valid college email';
      isValid = false;
    }

    if (!collegeId || collegeId.length < 5) {
      newErrors.collegeId = 'Please enter a valid college ID';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, collegeId);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.green.neonLime, theme.colors.green.lime]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>🎯</Text>
            <Text style={styles.title}>CampusClub</Text>
            <Text style={styles.subtitle}>Connect with your college community</Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="College Email"
              placeholder="alex@college.edu"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.input}
            />

            <Input
              label="College ID"
              placeholder="CS202145"
              value={collegeId}
              onChangeText={setCollegeId}
              error={errors.collegeId}
              autoCapitalize="characters"
              containerStyle={styles.input}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              backgroundColor={theme.colors.blue.indigo}
              style={styles.button}
              size="large"
            />

            <Text style={styles.infoText}>
              Use your college-issued email and ID to sign in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    fontSize: 80,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.darkGrey,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: theme.spacing.lg,
  },
  button: {
    marginTop: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.darkGrey,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
