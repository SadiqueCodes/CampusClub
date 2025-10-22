import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { theme } from '../theme';
import { useStore } from '../store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation values
  const curvePosition = useRef(new Animated.Value(SCREEN_HEIGHT * 0.62)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  const login = useStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    Animated.sequence([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(curvePosition, {
          toValue: SCREEN_HEIGHT * 0.35,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setShowWelcome(false);
    });
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
colors={['#B06579', '#CE678A', '#E372A1']}   
     style={styles.gradient}
      >
        {/* Floral & Book Pattern Overlay */}
        <View style={styles.patternContainer}>
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.6} style={styles.pattern}>
            {/* Flower 1 - Top Left */}
            <Circle cx={SCREEN_WIDTH * 0.12} cy={SCREEN_HEIGHT * 0.1} r="8" fill="rgba(255,255,255,0.15)" />
            <Circle cx={SCREEN_WIDTH * 0.12 - 8} cy={SCREEN_HEIGHT * 0.1} r="6" fill="rgba(255,255,255,0.15)" />
            <Circle cx={SCREEN_WIDTH * 0.12 + 8} cy={SCREEN_HEIGHT * 0.1} r="6" fill="rgba(255,255,255,0.15)" />
            <Circle cx={SCREEN_WIDTH * 0.12} cy={SCREEN_HEIGHT * 0.1 - 8} r="6" fill="rgba(255,255,255,0.15)" />
            <Circle cx={SCREEN_WIDTH * 0.12} cy={SCREEN_HEIGHT * 0.1 + 8} r="6" fill="rgba(255,255,255,0.15)" />
            <Circle cx={SCREEN_WIDTH * 0.12} cy={SCREEN_HEIGHT * 0.1} r="3" fill="rgba(255,255,255,0.3)" />

            {/* Book 1 - Top Right */}
            <Path
              d={`M${SCREEN_WIDTH * 0.8},${SCREEN_HEIGHT * 0.12} L${SCREEN_WIDTH * 0.8 + 25},${SCREEN_HEIGHT * 0.12} L${SCREEN_WIDTH * 0.8 + 25},${SCREEN_HEIGHT * 0.12 + 30} L${SCREEN_WIDTH * 0.8},${SCREEN_HEIGHT * 0.12 + 30} Z`}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.5"
              fill="rgba(255,255,255,0.08)"
            />
            <Line x1={SCREEN_WIDTH * 0.8 + 12.5} y1={SCREEN_HEIGHT * 0.12} x2={SCREEN_WIDTH * 0.8 + 12.5} y2={SCREEN_HEIGHT * 0.12 + 30} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

            {/* Flower 2 - Center */}
            <Circle cx={SCREEN_WIDTH * 0.5} cy={SCREEN_HEIGHT * 0.22} r="10" fill="rgba(255,255,255,0.12)" />
            <Circle cx={SCREEN_WIDTH * 0.5 - 10} cy={SCREEN_HEIGHT * 0.22} r="7" fill="rgba(255,255,255,0.12)" />
            <Circle cx={SCREEN_WIDTH * 0.5 + 10} cy={SCREEN_HEIGHT * 0.22} r="7" fill="rgba(255,255,255,0.12)" />
            <Circle cx={SCREEN_WIDTH * 0.5} cy={SCREEN_HEIGHT * 0.22 - 10} r="7" fill="rgba(255,255,255,0.12)" />
            <Circle cx={SCREEN_WIDTH * 0.5} cy={SCREEN_HEIGHT * 0.22 + 10} r="7" fill="rgba(255,255,255,0.12)" />
            <Circle cx={SCREEN_WIDTH * 0.5} cy={SCREEN_HEIGHT * 0.22} r="4" fill="rgba(255,255,255,0.25)" />

            {/* Leaves - scattered */}
            <Path d={`M${SCREEN_WIDTH * 0.25},${SCREEN_HEIGHT * 0.18} Q${SCREEN_WIDTH * 0.25 + 5},${SCREEN_HEIGHT * 0.18 - 8} ${SCREEN_WIDTH * 0.25 + 10},${SCREEN_HEIGHT * 0.18}`} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
            <Path d={`M${SCREEN_WIDTH * 0.7},${SCREEN_HEIGHT * 0.28} Q${SCREEN_WIDTH * 0.7 + 5},${SCREEN_HEIGHT * 0.28 - 8} ${SCREEN_WIDTH * 0.7 + 10},${SCREEN_HEIGHT * 0.28}`} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />

            {/* Book 2 - Left */}
            <Path
              d={`M${SCREEN_WIDTH * 0.15},${SCREEN_HEIGHT * 0.35} L${SCREEN_WIDTH * 0.15 + 22},${SCREEN_HEIGHT * 0.35} L${SCREEN_WIDTH * 0.15 + 22},${SCREEN_HEIGHT * 0.35 + 28} L${SCREEN_WIDTH * 0.15},${SCREEN_HEIGHT * 0.35 + 28} Z`}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.5"
              fill="rgba(255,255,255,0.08)"
            />

            {/* Flower 3 - Right */}
            <Circle cx={SCREEN_WIDTH * 0.85} cy={SCREEN_HEIGHT * 0.38} r="9" fill="rgba(255,255,255,0.13)" />
            <Circle cx={SCREEN_WIDTH * 0.85 - 9} cy={SCREEN_HEIGHT * 0.38} r="6" fill="rgba(255,255,255,0.13)" />
            <Circle cx={SCREEN_WIDTH * 0.85 + 9} cy={SCREEN_HEIGHT * 0.38} r="6" fill="rgba(255,255,255,0.13)" />
            <Circle cx={SCREEN_WIDTH * 0.85} cy={SCREEN_HEIGHT * 0.38 - 9} r="6" fill="rgba(255,255,255,0.13)" />
            <Circle cx={SCREEN_WIDTH * 0.85} cy={SCREEN_HEIGHT * 0.38 + 9} r="6" fill="rgba(255,255,255,0.13)" />

            {/* Small decorative elements */}
            <Circle cx={SCREEN_WIDTH * 0.35} cy={SCREEN_HEIGHT * 0.45} r="3" fill="rgba(255,255,255,0.2)" />
            <Circle cx={SCREEN_WIDTH * 0.6} cy={SCREEN_HEIGHT * 0.15} r="3" fill="rgba(255,255,255,0.2)" />
            <Circle cx={SCREEN_WIDTH * 0.9} cy={SCREEN_HEIGHT * 0.25} r="3" fill="rgba(255,255,255,0.2)" />

            {/* Flowing vine */}
            <Path
              d={`M0,${SCREEN_HEIGHT * 0.3} Q${SCREEN_WIDTH * 0.2},${SCREEN_HEIGHT * 0.28} ${SCREEN_WIDTH * 0.4},${SCREEN_HEIGHT * 0.32} T${SCREEN_WIDTH * 0.8},${SCREEN_HEIGHT * 0.3}`}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1.5"
              fill="none"
            />
          </Svg>
        </View>
      </LinearGradient>

      {/* Animated White Curved Section */}
      <Animated.View style={[styles.whiteSection, { top: curvePosition }]}>
        <Svg width={SCREEN_WIDTH} height={100} style={styles.curve}>
          <Path
            d={`M0,50 Q${SCREEN_WIDTH * 0.25},0 ${SCREEN_WIDTH * 0.5},50 Q${SCREEN_WIDTH * 0.75},90 ${SCREEN_WIDTH},50 L${SCREEN_WIDTH},100 L0,100 Z`}
            fill="white"
          />
        </Svg>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.contentContainer}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {showWelcome ? (
              <Animated.View style={[styles.welcomeContent, { opacity: contentOpacity }]}>
                <Text style={styles.welcomeTitle}>Welcome</Text>
                <Text style={styles.welcomeSubtitle}>
                  Connect with your college community.{'\n'}Join clubs, attend events, and make friends.
                </Text>
                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View style={[styles.loginContent, { opacity: formOpacity }]}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Sign in</Text>
                  <View style={styles.underline} />
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#B2BEB5" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="demo@email.com"
                      placeholderTextColor="#DDD"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#B2BEB5" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#DDD"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#B2BEB5" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberMe}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Ionicons name="checkmark" size={14} color="#E372A1" />}
                    </View>
                    <Text style={styles.rememberText}>Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <Text style={styles.loginButtonText}>{loading ? 'Loading...' : 'Login'}</Text>
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an Account? </Text>
                  <TouchableOpacity>
                    <Text style={styles.signupLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
  },
  patternContainer: {
    flex: 1,
  },
  pattern: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  whiteSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.7,
  },
  curve: {
    position: 'absolute',
    top: -80,
    left: 0,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  welcomeContent: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#636E72',
    lineHeight: 22,
    marginBottom: 60,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    gap: 12,
  },
  continueText: {
    fontSize: 16,
    color: '#636E72',
    fontWeight: '500',
  },
  arrowCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E372A1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginContent: {
    paddingHorizontal: 32,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },
  underline: {
    width: 60,
    height: 3,
    backgroundColor: '#E372A1',
    borderRadius: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2D3436',
  },
  eyeIcon: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E372A1',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFF',
  },
  rememberText: {
    fontSize: 13,
    color: '#636E72',
  },
  forgotText: {
    fontSize: 13,
    color: '#E372A1',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#E372A1',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...theme.shadows.sm,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#636E72',
  },
  signupLink: {
    fontSize: 14,
    color: '#E372A1',
    fontWeight: '600',
  },
});
