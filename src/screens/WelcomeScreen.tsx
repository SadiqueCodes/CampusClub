import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { theme } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <View style={styles.container}>
      {/* Pink Gradient Background */}
      <LinearGradient
        colors={['#FFB4B4', '#FF9B9B', '#FF8C8C']}
        style={styles.gradient}
      >
        {/* Abstract Pattern Overlay */}
        <View style={styles.patternContainer}>
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.6} style={styles.pattern}>
            {/* Wave patterns */}
            <Path
              d={`M0,${SCREEN_HEIGHT * 0.15} Q${SCREEN_WIDTH * 0.25},${SCREEN_HEIGHT * 0.1} ${SCREEN_WIDTH * 0.5},${SCREEN_HEIGHT * 0.15} T${SCREEN_WIDTH},${SCREEN_HEIGHT * 0.15}`}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              fill="none"
            />
            <Path
              d={`M0,${SCREEN_HEIGHT * 0.25} Q${SCREEN_WIDTH * 0.3},${SCREEN_HEIGHT * 0.2} ${SCREEN_WIDTH * 0.6},${SCREEN_HEIGHT * 0.25} T${SCREEN_WIDTH},${SCREEN_HEIGHT * 0.25}`}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
              fill="none"
            />
            <Circle cx={SCREEN_WIDTH * 0.2} cy={SCREEN_HEIGHT * 0.1} r="30" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
            <Circle cx={SCREEN_WIDTH * 0.8} cy={SCREEN_HEIGHT * 0.35} r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
            <Line x1={SCREEN_WIDTH * 0.1} y1={SCREEN_HEIGHT * 0.3} x2={SCREEN_WIDTH * 0.3} y2={SCREEN_HEIGHT * 0.4} stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
            <Line x1={SCREEN_WIDTH * 0.7} y1={SCREEN_HEIGHT * 0.15} x2={SCREEN_WIDTH * 0.85} y2={SCREEN_HEIGHT * 0.25} stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          </Svg>
        </View>
      </LinearGradient>

      {/* White Curved Bottom Section */}
      <View style={styles.bottomSection}>
        <Svg width={SCREEN_WIDTH} height={100} style={styles.curve}>
          <Path
            d={`M0,80 Q${SCREEN_WIDTH * 0.5},0 ${SCREEN_WIDTH},80 L${SCREEN_WIDTH},100 L0,100 Z`}
            fill="white"
          />
        </Svg>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Connect with your college community.{'\n'}Join clubs, attend events, and make friends.
          </Text>

          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueText}>Continue</Text>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
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
    height: SCREEN_HEIGHT * 0.55,
  },
  patternContainer: {
    flex: 1,
  },
  pattern: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  curve: {
    position: 'absolute',
    top: -80,
    left: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#636E72',
    lineHeight: 22,
    marginBottom: 60,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  continueText: {
    fontSize: 18,
    color: '#636E72',
    fontWeight: '500',
  },
  arrowCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF9B9B',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
});
