import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, ScrollView, KeyboardAvoidingView, Platform, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { Lobster_400Regular } from '@expo-google-fonts/lobster';
import { theme } from '../theme';
import { useStore } from '../store';
import { User } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const yearOptions: Array<{ value: User['year']; label: string }> = [
  { value: 'Freshman', label: 'First Year' },
  { value: 'Sophomore', label: 'Second Year' },
  { value: 'Junior', label: 'Third Year' },
  { value: 'Senior', label: 'Fourth Year' },
];
const interestOptions = [
  'Technology',
  'Design',
  'Entrepreneurship',
  'Sports',
  'Music',
  'Volunteering',
  'Photography',
  'Gaming',
];

export const LoginScreen: React.FC = () => {
  const [fontsLoaded] = useFonts({
    Lobster_400Regular,
  });

  const [showWelcome, setShowWelcome] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1);
  const totalSignUpSteps = 3;
  const [studentId, setStudentId] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [major, setMajor] = useState('');
  const [selectedYear, setSelectedYear] = useState<User['year'] | ''>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Animation values
  const curvePosition = useRef(new Animated.Value(SCREEN_HEIGHT * 0.62)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Seamless infinite scroll animation
    const cardWidth = SCREEN_WIDTH * 0.7;
    const gap = 12;
    const totalCardWidth = cardWidth + gap;
    const cardsWidth = totalCardWidth * 3; // 3 unique cards

    scrollX.setValue(0);

    const scrollAnimation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -cardsWidth,
        duration: 15000, // 15 seconds for smooth pace
        useNativeDriver: true,
        isInteraction: false, // Prevents animation from stopping on interactions
      }),
      {
        resetBeforeIteration: true, // Reset to start position before each loop
      }
    );

    scrollAnimation.start();

    return () => {
      scrollAnimation.stop();
    };
  }, [scrollX]);

  const login = useStore((state) => state.login);
  const stepDetails = [
    { title: 'Basic info', subtitle: 'Tell us how to reach you' },
    { title: 'Campus details', subtitle: 'Share your program info' },
    { title: 'Interests', subtitle: 'Pick topics you care about' },
  ];

  const resetSignUpForm = () => {
    setSignUpStep(1);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setStudentId('');
    setCollegeName('');
    setMajor('');
    setSelectedYear('');
    setSelectedInterests([]);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest]
    );
  };

  const validateSignUpStep = (step = signUpStep) => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Missing info', 'Please enter your full name to continue.');
        return false;
      }
      if (!email.trim()) {
        Alert.alert('Missing info', 'Please enter a valid email address.');
        return false;
      }
      if (!password || password.length < 6) {
        Alert.alert('Weak password', 'Use at least 6 characters for your password.');
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert('Mismatch', 'Passwords do not match.');
        return false;
      }
    } else if (step === 2) {
      if (!collegeName.trim() || !studentId.trim() || !major.trim() || !selectedYear) {
        Alert.alert('Missing campus info', 'Add your college, ID, major, and year.');
        return false;
      }
    }
    return true;
  };

  const handleNextSignUpStep = () => {
    if (validateSignUpStep()) {
      setSignUpStep((prev) => Math.min(prev + 1, totalSignUpSteps));
    }
  };

  const handleBackSignUpStep = () => {
    setSignUpStep((prev) => Math.max(prev - 1, 1));
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login({ email });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateSignUpStep()) return;
    setLoading(true);
    try {
      await login({
        name,
        email,
        collegeId: studentId || `ID-${Date.now()}`,
        collegeName: collegeName || 'My Campus',
        major: major || 'Undeclared',
        year: (selectedYear as User['year']) || 'Freshman',
        interests: selectedInterests.length ? selectedInterests : ['Campus Life'],
      });
      resetSignUpForm();
      setIsSignUp(false);
    } catch (error) {
      console.error('Sign up error:', error);
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

  const currentStepDetail = stepDetails[Math.min(signUpStep - 1, stepDetails.length - 1)] || {
    title: '',
    subtitle: '',
  };

  const handlePrimaryAction = () => {
    if (loading) return;
    if (isSignUp) {
      if (signUpStep < totalSignUpSteps) {
        handleNextSignUpStep();
      } else {
        handleSignUp();
      }
    } else {
      handleLogin();
    }
  };

  const handleToggleAuthMode = () => {
    if (isSignUp) {
      resetSignUpForm();
    } else {
      setSignUpStep(1);
    }
    setIsSignUp((prev) => !prev);
  };

  const renderSignInForm = () => (
    <>
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
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#B2BEB5" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.optionsRow}>
        <TouchableOpacity style={styles.rememberMe} onPress={() => setRememberMe(!rememberMe)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Ionicons name="checkmark" size={14} color="#E372A1" />}
          </View>
          <Text style={styles.rememberText}>Remember Me</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSignUpSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = signUpStep === stepNumber;
        const isCompleted = signUpStep > stepNumber;
        return (
          <View key={stepNumber} style={styles.stepIndicatorItem}>
            <View
              style={[
                styles.stepCircle,
                (isActive || isCompleted) && styles.stepCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.stepCircleText,
                  (isActive || isCompleted) && styles.stepCircleTextActive,
                ]}
              >
                {stepNumber}
              </Text>
            </View>
            {stepNumber < totalSignUpSteps && (
              <View
                style={[
                  styles.stepLine,
                  signUpStep > stepNumber && styles.stepLineActive,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );

  const renderSignUpStepContent = () => {
    switch (signUpStep) {
      case 1:
        return (
          <>
            <Text style={styles.stepMetaText}>Step {signUpStep} of {totalSignUpSteps} • Basic info</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#B2BEB5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#DDD"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#B2BEB5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@college.edu"
                  placeholderTextColor="#DDD"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#B2BEB5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#DDD"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#B2BEB5" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#B2BEB5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#DDD"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#B2BEB5" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.stepMetaText}>Step {signUpStep} of {totalSignUpSteps} • Campus details</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>University / College</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="school-outline" size={20} color="#B2BEB5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Tech University"
                  placeholderTextColor="#DDD"
                  value={collegeName}
                  onChangeText={setCollegeName}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Student ID</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color="#B2BEB5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. CS2023123"
                  placeholderTextColor="#DDD"
                  value={studentId}
                  onChangeText={setStudentId}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Major</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="book-outline" size={20} color="#B2BEB5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Computer Science"
                  placeholderTextColor="#DDD"
                  value={major}
                  onChangeText={setMajor}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Year</Text>
              <View style={styles.yearGrid}>
                {yearOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.yearOption, selectedYear === option.value && styles.yearOptionSelected]}
                    onPress={() => setSelectedYear(option.value)}
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        selectedYear === option.value && styles.yearOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );
      case 3:
      default:
        return (
          <>
            <Text style={styles.stepMetaText}>Step {signUpStep} of {totalSignUpSteps} • Interests</Text>
            <Text style={styles.stepHelperText}>Choose a few interests so we can personalize club suggestions.</Text>
            <View style={styles.chipsContainer}>
              {interestOptions.map((interest) => {
                const active = selectedInterests.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    style={[styles.chip, active && styles.chipSelected]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextSelected]}>{interest}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        );
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
colors={['#B06579', '#CE678A', '#E372A1']}   
     style={styles.gradient}
      >
        {/* Beautiful Decorative Pattern Overlay */}
        <View style={styles.patternContainer}>
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.6} style={styles.pattern}>
            {/* Patch 1 - Top Left Cluster */}
            <Circle cx={SCREEN_WIDTH * 0.15} cy={SCREEN_HEIGHT * 0.08} r="25" fill="rgba(255,255,255,0.05)" />
            <Circle cx={SCREEN_WIDTH * 0.1} cy={SCREEN_HEIGHT * 0.12} r="15" fill="rgba(255,255,255,0.08)" />
            <Circle cx={SCREEN_WIDTH * 0.2} cy={SCREEN_HEIGHT * 0.11} r="18" fill="rgba(255,255,255,0.06)" />
            <Circle cx={SCREEN_WIDTH * 0.15} cy={SCREEN_HEIGHT * 0.08} r="8" fill="rgba(255,255,255,0.15)" />
            <Circle cx={SCREEN_WIDTH * 0.12} cy={SCREEN_HEIGHT * 0.1} r="5" fill="rgba(255,255,255,0.2)" />

            {/* Patch 2 - Top Right Floating Elements */}
            <Circle cx={SCREEN_WIDTH * 0.85} cy={SCREEN_HEIGHT * 0.1} r="30" fill="rgba(255,255,255,0.04)" />
            <Circle cx={SCREEN_WIDTH * 0.88} cy={SCREEN_HEIGHT * 0.14} r="12" fill="rgba(255,255,255,0.1)" />
            <Circle cx={SCREEN_WIDTH * 0.82} cy={SCREEN_HEIGHT * 0.08} r="8" fill="rgba(255,255,255,0.12)" />
            <Path
              d={`M${SCREEN_WIDTH * 0.9},${SCREEN_HEIGHT * 0.12} Q${SCREEN_WIDTH * 0.92},${SCREEN_HEIGHT * 0.1} ${SCREEN_WIDTH * 0.94},${SCREEN_HEIGHT * 0.12}`}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              fill="none"
            />

            {/* Patch 3 - Center Large Feature */}
            <Circle cx={SCREEN_WIDTH * 0.5} cy={SCREEN_HEIGHT * 0.25} r="40" fill="rgba(255,255,255,0.03)" />
            <Circle cx={SCREEN_WIDTH * 0.5} cy={SCREEN_HEIGHT * 0.25} r="20" fill="rgba(255,255,255,0.08)" />
            <Circle cx={SCREEN_WIDTH * 0.45} cy={SCREEN_HEIGHT * 0.23} r="10" fill="rgba(255,255,255,0.12)" />
            <Circle cx={SCREEN_WIDTH * 0.55} cy={SCREEN_HEIGHT * 0.27} r="12" fill="rgba(255,255,255,0.1)" />
            <Circle cx={SCREEN_WIDTH * 0.5} cy={SCREEN_HEIGHT * 0.25} r="5" fill="rgba(255,255,255,0.2)" />

            {/* Patch 4 - Left Mid Organic Shapes */}
            <Circle cx={SCREEN_WIDTH * 0.2} cy={SCREEN_HEIGHT * 0.35} r="20" fill="rgba(255,255,255,0.06)" />
            <Circle cx={SCREEN_WIDTH * 0.25} cy={SCREEN_HEIGHT * 0.38} r="15" fill="rgba(255,255,255,0.08)" />
            <Circle cx={SCREEN_WIDTH * 0.18} cy={SCREEN_HEIGHT * 0.32} r="10" fill="rgba(255,255,255,0.1)" />
            <Path
              d={`M${SCREEN_WIDTH * 0.15},${SCREEN_HEIGHT * 0.4} Q${SCREEN_WIDTH * 0.2},${SCREEN_HEIGHT * 0.38} ${SCREEN_WIDTH * 0.25},${SCREEN_HEIGHT * 0.4}`}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2"
              fill="none"
            />

            {/* Patch 5 - Right Lower Cluster */}
            <Circle cx={SCREEN_WIDTH * 0.75} cy={SCREEN_HEIGHT * 0.42} r="35" fill="rgba(255,255,255,0.04)" />
            <Circle cx={SCREEN_WIDTH * 0.8} cy={SCREEN_HEIGHT * 0.4} r="18" fill="rgba(255,255,255,0.08)" />
            <Circle cx={SCREEN_WIDTH * 0.7} cy={SCREEN_HEIGHT * 0.45} r="14" fill="rgba(255,255,255,0.1)" />
            <Circle cx={SCREEN_WIDTH * 0.78} cy={SCREEN_HEIGHT * 0.43} r="8" fill="rgba(255,255,255,0.15)" />

            {/* Scattered Small Dots */}
            <Circle cx={SCREEN_WIDTH * 0.35} cy={SCREEN_HEIGHT * 0.15} r="4" fill="rgba(255,255,255,0.15)" />
            <Circle cx={SCREEN_WIDTH * 0.65} cy={SCREEN_HEIGHT * 0.2} r="5" fill="rgba(255,255,255,0.12)" />
            <Circle cx={SCREEN_WIDTH * 0.3} cy={SCREEN_HEIGHT * 0.48} r="3" fill="rgba(255,255,255,0.18)" />
            <Circle cx={SCREEN_WIDTH * 0.92} cy={SCREEN_HEIGHT * 0.35} r="4" fill="rgba(255,255,255,0.14)" />
            <Circle cx={SCREEN_WIDTH * 0.08} cy={SCREEN_HEIGHT * 0.28} r="3" fill="rgba(255,255,255,0.16)" />
            <Circle cx={SCREEN_WIDTH * 0.55} cy={SCREEN_HEIGHT * 0.45} r="4" fill="rgba(255,255,255,0.13)" />

            {/* Flowing Curved Lines */}
            <Path
              d={`M0,${SCREEN_HEIGHT * 0.2} Q${SCREEN_WIDTH * 0.15},${SCREEN_HEIGHT * 0.18} ${SCREEN_WIDTH * 0.3},${SCREEN_HEIGHT * 0.2}`}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
              fill="none"
            />
            <Path
              d={`M${SCREEN_WIDTH * 0.6},${SCREEN_HEIGHT * 0.3} Q${SCREEN_WIDTH * 0.7},${SCREEN_HEIGHT * 0.28} ${SCREEN_WIDTH * 0.8},${SCREEN_HEIGHT * 0.3}`}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
              fill="none"
            />
            <Path
              d={`M${SCREEN_WIDTH * 0.1},${SCREEN_HEIGHT * 0.45} Q${SCREEN_WIDTH * 0.25},${SCREEN_HEIGHT * 0.43} ${SCREEN_WIDTH * 0.4},${SCREEN_HEIGHT * 0.45}`}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="2"
              fill="none"
            />
          </Svg>
        </View>

        {/* CampusClub Title and Feature Cards */}
        <View style={styles.headerContent}>
          <Text style={styles.appTitle}>CampusClub</Text>

          <View style={styles.cardsContainer}>
            <Animated.View
              style={[
                styles.cardsRow,
                {
                  transform: [{ translateX: scrollX }],
                },
              ]}
            >
              {/* First set of cards */}
              <View style={styles.featureCard}>
                <LinearGradient
                  colors={['#fff', '#FFF5F8', '#fff']}
                  style={styles.featureCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <LinearGradient
                    colors={['#E372A1', '#CE678A', '#B06579']}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="people" size={36} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.featureCardTitle}>Join Clubs</Text>
                  <Text style={styles.featureCardSubtitle}>Connect with students</Text>
                  <View style={styles.decorativeDots}>
                    <View style={[styles.dot, { backgroundColor: '#E372A1' }]} />
                    <View style={[styles.dot, { backgroundColor: '#CE678A' }]} />
                    <View style={[styles.dot, { backgroundColor: '#B06579' }]} />
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.featureCard}>
                <LinearGradient
                  colors={['#fff', '#FFF5F8', '#fff']}
                  style={styles.featureCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <LinearGradient
                    colors={['#E372A1', '#CE678A', '#B06579']}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="calendar" size={36} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.featureCardTitle}>Events</Text>
                  <Text style={styles.featureCardSubtitle}>Discover activities</Text>
                  <View style={styles.decorativeDots}>
                    <View style={[styles.dot, { backgroundColor: '#E372A1' }]} />
                    <View style={[styles.dot, { backgroundColor: '#CE678A' }]} />
                    <View style={[styles.dot, { backgroundColor: '#B06579' }]} />
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.featureCard}>
                <LinearGradient
                  colors={['#fff', '#FFF5F8', '#fff']}
                  style={styles.featureCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <LinearGradient
                    colors={['#E372A1', '#CE678A', '#B06579']}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="chatbubbles" size={36} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.featureCardTitle}>Chat</Text>
                  <Text style={styles.featureCardSubtitle}>Stay connected</Text>
                  <View style={styles.decorativeDots}>
                    <View style={[styles.dot, { backgroundColor: '#E372A1' }]} />
                    <View style={[styles.dot, { backgroundColor: '#CE678A' }]} />
                    <View style={[styles.dot, { backgroundColor: '#B06579' }]} />
                  </View>
                </LinearGradient>
              </View>

              {/* Duplicate set for seamless loop */}
              <View style={styles.featureCard}>
                <LinearGradient
                  colors={['#fff', '#FFF5F8', '#fff']}
                  style={styles.featureCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <LinearGradient
                    colors={['#E372A1', '#CE678A', '#B06579']}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="people" size={36} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.featureCardTitle}>Join Clubs</Text>
                  <Text style={styles.featureCardSubtitle}>Connect with students</Text>
                  <View style={styles.decorativeDots}>
                    <View style={[styles.dot, { backgroundColor: '#E372A1' }]} />
                    <View style={[styles.dot, { backgroundColor: '#CE678A' }]} />
                    <View style={[styles.dot, { backgroundColor: '#B06579' }]} />
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.featureCard}>
                <LinearGradient
                  colors={['#fff', '#FFF5F8', '#fff']}
                  style={styles.featureCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <LinearGradient
                    colors={['#E372A1', '#CE678A', '#B06579']}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="calendar" size={36} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.featureCardTitle}>Events</Text>
                  <Text style={styles.featureCardSubtitle}>Discover activities</Text>
                  <View style={styles.decorativeDots}>
                    <View style={[styles.dot, { backgroundColor: '#E372A1' }]} />
                    <View style={[styles.dot, { backgroundColor: '#CE678A' }]} />
                    <View style={[styles.dot, { backgroundColor: '#B06579' }]} />
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.featureCard}>
                <LinearGradient
                  colors={['#fff', '#FFF5F8', '#fff']}
                  style={styles.featureCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <LinearGradient
                    colors={['#E372A1', '#CE678A', '#B06579']}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name="chatbubbles" size={36} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.featureCardTitle}>Chat</Text>
                  <Text style={styles.featureCardSubtitle}>Stay connected</Text>
                  <View style={styles.decorativeDots}>
                    <View style={[styles.dot, { backgroundColor: '#E372A1' }]} />
                    <View style={[styles.dot, { backgroundColor: '#CE678A' }]} />
                    <View style={[styles.dot, { backgroundColor: '#B06579' }]} />
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          </View>
        </View>
      </LinearGradient>

      {/* Clickable overlay to go back to welcome */}
      {!showWelcome && (
        <TouchableOpacity
          style={styles.headerOverlay}
          activeOpacity={1}
          onPress={() => {
            Animated.sequence([
              Animated.timing(formOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.parallel([
                Animated.timing(curvePosition, {
                  toValue: SCREEN_HEIGHT * 0.62,
                  duration: 500,
                  useNativeDriver: false,
                }),
                Animated.timing(contentOpacity, {
                  toValue: 1,
                  duration: 400,
                  delay: 100,
                  useNativeDriver: true,
                }),
              ]),
            ]).start(() => {
              setShowWelcome(true);
            });
          }}
        />
      )}

      {/* Animated White Curved Section */}
      <Animated.View style={[styles.whiteSection, { top: curvePosition }]}>
        <Svg width={SCREEN_WIDTH} height={100} style={styles.curve}>
          <Path
            d={`M0,50 Q${SCREEN_WIDTH * 0.25},0 ${SCREEN_WIDTH * 0.5},50 Q${SCREEN_WIDTH * 0.75},90 ${SCREEN_WIDTH},50 L${SCREEN_WIDTH},100 L0,100 Z`}
            fill="white"
          />
          <Path
            d={`M0,50 Q${SCREEN_WIDTH * 0.25},0 ${SCREEN_WIDTH * 0.5},50 Q${SCREEN_WIDTH * 0.75},90 ${SCREEN_WIDTH},50`}
            stroke="rgba(227,114,161,0.2)"
            strokeWidth="2"
            fill="none"
          />
        </Svg>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.contentContainer}
        >
          {showWelcome ? (
            <ScrollView showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          ) : (
            <Animated.View style={[styles.loginContent, { opacity: formOpacity }]}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{isSignUp ? 'Sign up' : 'Sign in'}</Text>
                <View style={styles.underline} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.formScroll}
                contentContainerStyle={styles.formScrollContent}
              >
                {isSignUp ? (
                  <>
                    {renderStepIndicator()}
                    <Text style={styles.stepTitleText}>{currentStepDetail.title}</Text>
                    <Text style={styles.stepSubtitleText}>{currentStepDetail.subtitle}</Text>
                    {renderSignUpStepContent()}
                    {signUpStep > 1 && (
                      <TouchableOpacity style={styles.backStepButton} onPress={handleBackSignUpStep}>
                        <Ionicons name="arrow-back" size={16} color="#B06579" />
                        <Text style={styles.backStepText}>Back</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  renderSignInForm()
                )}

                <TouchableOpacity
                  style={[styles.loginButton, isSignUp && { marginTop: 24 }]}
                  onPress={handlePrimaryAction}
                  disabled={loading}
                >
                  <Text style={styles.loginButtonText}>
                    {loading
                      ? 'Loading...'
                      : isSignUp
                      ? signUpStep === totalSignUpSteps
                        ? 'Create Account'
                        : 'Next'
                      : 'Login'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>
                    {isSignUp ? 'Already have an Account? ' : "Don't have an Account? "}
                  </Text>
                  <TouchableOpacity onPress={handleToggleAuthMode}>
                    <Text style={styles.signupLink}>{isSignUp ? 'Sign in' : 'Sign up'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          )}
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
  headerContent: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  appTitle: {
    fontSize: 40,
    fontFamily: 'Lobster_400Regular',
    color: '#fff',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 1,
  },
  cardsContainer: {
    overflow: 'hidden',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    width: SCREEN_WIDTH * 0.7,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  featureCardGradient: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  featureIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  featureCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureCardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  decorativeDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.35,
    zIndex: 10,
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
    flex: 1,
    paddingHorizontal: 32,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingBottom: 80,
  },
  titleContainer: {
    marginBottom: 24,
    paddingTop: 0,
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  stepCircleActive: {
    borderColor: '#E372A1',
    backgroundColor: '#E372A1',
  },
  stepCircleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepCircleTextActive: {
    color: '#fff',
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#E372A1',
  },
  stepTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  stepSubtitleText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  stepMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  stepHelperText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
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
    height: 48,
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
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  yearOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  yearOptionSelected: {
    borderColor: '#E372A1',
    backgroundColor: '#FFF5F8',
  },
  yearOptionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  yearOptionTextSelected: {
    color: '#B06579',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: '#E372A1',
    borderColor: '#E372A1',
  },
  chipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
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
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backStepText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B06579',
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
