import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <View style={styles.container}>
      {/* Pink Gradient Background */}
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
        style={styles.gradient}
      >
        <View style={styles.topSection}>
          <Text style={styles.appName}>CampusClub</Text>
          <Text style={styles.tagline}>Your Campus Community</Text>

          {/* Feature Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
            style={styles.cardsScroll}
          >
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#fff', '#F8F9FA']}
                style={styles.featureCardGradient}
              >
                <View style={styles.featureIconContainer}>
                  <LinearGradient
                    colors={['#E372A1', '#CE678A', '#B06579']}
                    style={styles.featureIcon}
                  >
                    <Ionicons name="people" size={32} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.featureTitle}>Join Clubs</Text>
                <Text style={styles.featureDescription}>
                  Connect with students who share your interests
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#fff', '#F8F9FA']}
                style={styles.featureCardGradient}
              >
                <View style={styles.featureIconContainer}>
                  <LinearGradient
                    colors={['#E372A1', '#CE678A', '#B06579']}
                    style={styles.featureIcon}
                  >
                    <Ionicons name="calendar" size={32} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.featureTitle}>Events</Text>
                <Text style={styles.featureDescription}>
                  Discover and attend exciting campus events
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#fff', '#F8F9FA']}
                style={styles.featureCardGradient}
              >
                <View style={styles.featureIconContainer}>
                  <LinearGradient
                    colors={['#E372A1', '#CE678A', '#B06579']}
                    style={styles.featureIcon}
                  >
                    <Ionicons name="chatbubbles" size={32} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.featureTitle}>Chat</Text>
                <Text style={styles.featureDescription}>
                  Stay connected with your community
                </Text>
              </LinearGradient>
            </View>
          </ScrollView>
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
          <Text style={styles.title}>Welcome to CampusClub</Text>
          <Text style={styles.subtitle}>
            Connect with your college community, join clubs, discover events, and make lasting friendships.
          </Text>

          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <LinearGradient
              colors={['#E372A1', '#CE678A', '#B06579']}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
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
    height: SCREEN_HEIGHT * 0.6,
  },
  topSection: {
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 40,
    fontWeight: '500',
  },
  cardsScroll: {
    marginHorizontal: -30,
  },
  cardsContainer: {
    paddingHorizontal: 30,
    gap: 16,
  },
  featureCard: {
    width: SCREEN_WIDTH * 0.7,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  featureCardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  featureIconContainer: {
    marginBottom: 16,
  },
  featureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.45,
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
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 40,
    fontWeight: '500',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  continueText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
});
