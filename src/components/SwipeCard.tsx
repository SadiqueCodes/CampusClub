import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ActivityIndicator } from 'react-native';
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
import supabase from '../lib/supabase';
import { getMarketplaceBucketName } from '../lib/storage';

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
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Reset position when user changes
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    setImageFailed(false);
    const raw = (user.profilePhoto || '').trim();
    setImageLoading(!!raw);
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

  const topInterests = user.interests.slice(0, 3);
  const visibleInterests = topInterests.slice(0, 2);
  const extraInterestCount = Math.max(0, (user.interests || []).length - visibleInterests.length);
  const yearShort =
    user.year === 'Freshman' ? '1st' : user.year === 'Sophomore' ? '2nd' : user.year === 'Junior' ? '3rd' : '4th';
  const resolvedProfilePhoto = (() => {
    const raw = (user.profilePhoto || '').trim();
    if (!raw) return '';
    if (/^(https?:\/\/|file:\/\/|content:\/\/|data:|blob:)/i.test(raw)) return raw;
    if (raw.includes('/storage/v1/object/public/')) return raw;
    const bucket = getMarketplaceBucketName();
    const { data } = supabase.storage.from(bucket).getPublicUrl(raw.replace(/^\/+/, ''));
    return data?.publicUrl || '';
  })();

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.cardInner}>
          {/* Profile Photo */}
          <LinearGradient
            colors={['#E372A1', '#CE678A', '#B06579']}
            style={styles.profilePhoto}
          >
            <View style={styles.avatarCircle}>
              {resolvedProfilePhoto && !imageFailed ? (
                <>
                  <Image
                    source={{ uri: resolvedProfilePhoto }}
                    style={[styles.avatarImage, imageLoading && styles.avatarImageHidden]}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                    onError={() => {
                      setImageFailed(true);
                      setImageLoading(false);
                    }}
                  />
                  {imageLoading && (
                    <LinearGradient
                      colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.25)']}
                      style={styles.imageLoadingGlaze}
                    >
                      <ActivityIndicator size="small" color="#B06579" />
                    </LinearGradient>
                  )}
                </>
              ) : (
                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              )}
            </View>
          </LinearGradient>

          {/* Swipe Stamps */}
          <Animated.View style={[styles.likeStamp, likeOpacityStyle]}>
            <Ionicons name="heart" size={32} color="#fff" />
            <Text style={styles.stampText}>INVITE</Text>
          </Animated.View>

          <Animated.View style={[styles.nopeStamp, nopeOpacityStyle]}>
            <Ionicons name="close" size={32} color="#fff" />
            <Text style={styles.stampText}>PASS</Text>
          </Animated.View>

          {/* User Info */}
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              <View style={styles.yearBadge}>
                <Text style={styles.yearText}>
                  {yearShort} Year - Sem {user.semester || '-'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="school" size={16} color="#B06579" />
              <Text style={styles.major} numberOfLines={1}>
                {user.major}
              </Text>
            </View>

            <View style={styles.tagRow}>
              {visibleInterests.length > 0 ? (
                <>
                  {visibleInterests.map((interest) => (
                    <View key={interest} style={styles.tagChip}>
                      <Text style={styles.tagChipText} numberOfLines={1}>
                        {interest}
                      </Text>
                    </View>
                  ))}
                  {extraInterestCount > 0 && (
                    <View style={styles.tagChip}>
                      <Text style={styles.tagChipText}>+{extraInterestCount}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.tagChip}>
                  <Text style={styles.tagChipText}>No interests yet</Text>
                </View>
              )}
            </View>

            <View style={styles.statsBlock}>
              <View style={styles.statsRow}>
                <View style={styles.statBubble}>
                  <Ionicons name="people" size={14} color="#fff" />
                  <Text style={styles.statBubbleText}>{(user.clubsJoined || []).length} clubs</Text>
                </View>
              </View>
              <View style={[styles.statBubble, styles.eventStatBubble]}>
                <Ionicons name="calendar" size={14} color="#fff" />
                <Text style={styles.statBubbleText}>Events: {user.eventsAttended}</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.85,
    height: 420,
    position: 'absolute',
  },
  cardInner: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  profilePhoto: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarImageHidden: {
    opacity: 0,
  },
  imageLoadingGlaze: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#B06579',
  },
  infoContainer: {
    padding: 16,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
  },
  yearBadge: {
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B06579',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  major: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  bioText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    marginBottom: 8,
    minHeight: 28,
    overflow: 'hidden',
  },
  tagChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#FFF5F8',
    maxWidth: 120,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B06579',
  },
  statsBlock: {
    gap: 8,
    marginTop: 'auto',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#B06579',
    borderRadius: 12,
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statBubbleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  eventStatBubble: {
    alignSelf: 'stretch',
  },
  likeStamp: {
    position: 'absolute',
    top: 20,
    right: 30,
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    transform: [{ rotate: '20deg' }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  nopeStamp: {
    position: 'absolute',
    top: 20,
    left: 30,
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    transform: [{ rotate: '-20deg' }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  stampText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});



