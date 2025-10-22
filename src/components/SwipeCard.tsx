import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { User } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeCardProps {
  user: User;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ user, onSwipeLeft, onSwipeRight }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5);
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
        runOnJS(onSwipeLeft)();
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
          {user.profilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.profilePhoto, styles.placeholderPhoto]}>
              <Text style={styles.placeholderText}>{user.name.charAt(0)}</Text>
            </View>
          )}

          <Animated.View style={[styles.likeStamp, likeOpacityStyle]}>
            <Text style={styles.stampText}>✓ INVITE</Text>
          </Animated.View>

          <Animated.View style={[styles.nopeStamp, nopeOpacityStyle]}>
            <Text style={styles.stampText}>✖ PASS</Text>
          </Animated.View>

          <View style={styles.infoContainer}>
            <Text style={styles.name}>{user.name}, {user.year === 'Freshman' ? '1st' : user.year === 'Sophomore' ? '2nd' : user.year === 'Junior' ? '3rd' : '4th'} Year</Text>
            <Text style={styles.major}>{user.major}</Text>

            {user.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                <Text style={styles.interestsLabel}>🎯 Interested in:</Text>
                <Text style={styles.interests}>{user.interests.join(', ')}</Text>
              </View>
            )}

            {user.clubsJoined.length > 0 && (
              <Text style={styles.clubs}>📚 {user.clubsJoined.length} clubs joined</Text>
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
    height: 500,
    position: 'absolute',
  },
  cardInner: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.lg,
    overflow: 'hidden',
  },
  profilePhoto: {
    width: '100%',
    height: 300,
    backgroundColor: theme.colors.border,
  },
  placeholderPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.blue.indigo,
  },
  placeholderText: {
    fontSize: 80,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
  },
  infoContainer: {
    padding: theme.spacing.lg,
  },
  name: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
    marginBottom: theme.spacing.xs,
  },
  major: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.darkGrey,
    marginBottom: theme.spacing.md,
  },
  interestsContainer: {
    marginBottom: theme.spacing.sm,
  },
  interestsLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.dark,
    marginBottom: theme.spacing.xs,
  },
  interests: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.darkGrey,
  },
  clubs: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.darkGrey,
  },
  likeStamp: {
    position: 'absolute',
    top: 50,
    right: 30,
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    transform: [{ rotate: '15deg' }],
  },
  nopeStamp: {
    position: 'absolute',
    top: 50,
    left: 30,
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    transform: [{ rotate: '-15deg' }],
  },
  stampText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
});
