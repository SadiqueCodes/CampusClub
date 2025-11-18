import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeCardProps {
  user: User;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ user, onSwipeLeft, onSwipeRight }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Reset position when user changes
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [user.id]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          runOnJS(direction > 0 ? onSwipeRight : onSwipeLeft)();
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  const nopeOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.cardInner}>
          {/* Profile Photo */}
          <LinearGradient
            colors={[theme.colors.primary[800], theme.colors.primary[600]]}
            style={styles.profilePhoto}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
          </LinearGradient>

          {/* Swipe Stamps */}
          <Animated.View style={[styles.likeStamp, likeOpacityStyle]}>
            <Ionicons name="heart" size={28} color="#0D9488" />
            <Text style={styles.stampText}>INVITE</Text>
          </Animated.View>

          <Animated.View style={[styles.nopeStamp, nopeOpacityStyle]}>
            <Ionicons name="close" size={28} color="#FF5C7C" />
            <Text style={styles.stampText}>PASS</Text>
          </Animated.View>

          {/* User Info */}
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              <View style={styles.yearBadge}>
                <Text style={styles.yearText}>
                  {user.year === 'Freshman' ? '1st' : user.year === 'Sophomore' ? '2nd' : user.year === 'Junior' ? '3rd' : '4th'} Year
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="school" size={16} color={theme.colors.secondary[300]} />
              <Text style={styles.major}>{user.major}</Text>
            </View>

            {user.interests.length > 0 && (
              <View style={styles.interestsSection}>
                <View style={styles.interestsHeader}>
                  <Ionicons name="heart" size={16} color={theme.colors.primary[400]} />
                  <Text style={styles.interestsLabel}>Interests</Text>
                </View>
                <View style={styles.interestsTags}>
                  {user.interests.slice(0, 4).map((interest, index) => (
                    <View key={index} style={styles.interestTag}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {user.clubsJoined.length > 0 && (
              <View style={styles.statsRow}>
                <Ionicons name="people" size={16} color="#6B7280" />
                <Text style={styles.statsText}>{user.clubsJoined.length} clubs joined</Text>
                <Ionicons name="calendar" size={16} color="#6B7280" style={styles.statsIcon} />
                <Text style={styles.statsText}>{user.eventsAttended} events attended</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: 550,
    position: 'absolute',
  },
  cardInner: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 20,
    overflow: 'hidden',
  },
  profilePhoto: {
    width: '100%',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background.home,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.primary[100],
  },
  infoContainer: {
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text.primary,
    flex: 1,
  },
  yearBadge: {
    backgroundColor: 'rgba(91,99,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary[200],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  major: {
    fontSize: 15,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  interestsSection: {
    marginBottom: 16,
  },
  interestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  interestsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  interestsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  interestText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsIcon: {
    marginLeft: 12,
  },
  statsText: {
    fontSize: 13,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  likeStamp: {
    position: 'absolute',
    top: 40,
    right: 30,
    backgroundColor: 'rgba(56,189,248,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    transform: [{ rotate: '20deg' }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
  },
  nopeStamp: {
    position: 'absolute',
    top: 40,
    left: 30,
    backgroundColor: 'rgba(255,92,124,0.18)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    transform: [{ rotate: '-20deg' }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF5C7C',
  },
  stampText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
