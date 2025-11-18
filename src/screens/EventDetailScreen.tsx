import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../types';
import { useStore } from '../store';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const EventDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const eventParam: Event = route.params?.event;
  const { currentUser, toggleEventInterest, events } = useStore();

  // Get the latest event data from store
  const event = events.find((e) => e.id === eventParam?.id) || eventParam;

  const [isInterested, setIsInterested] = useState(
    event?.interestedUserIds?.includes(currentUser?.id || '') || false
  );

  if (!event) {
    return null;
  }

  const handleInterested = () => {
    if (currentUser) {
      toggleEventInterest(event.id, currentUser.id);
      setIsInterested(!isInterested);
      Alert.alert(
        isInterested ? 'Removed' : 'Added!',
        isInterested
          ? 'Removed from interested list'
          : 'Marked as interested! You will be notified of any updates.'
      );
    }
  };

  const handleRegister = () => {
    Alert.alert(
      'Registration Successful!',
      'You have been registered for this event. Check your email for confirmation.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <LinearGradient
        colors={theme.colors.gradients.chat}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Event Banner */}
        {event.bannerImage ? (
          <Image source={{ uri: event.bannerImage }} style={styles.banner} />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <LinearGradient
              colors={theme.colors.gradients.create}
              style={styles.bannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="calendar" size={60} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Event Title */}
          <Text style={styles.eventTitle}>{event.title}</Text>

          {/* Organized By Badge */}
          <View style={styles.organizedByContainer}>
            <View style={styles.organizedByBadge}>
              <Ionicons name="people" size={16} color={theme.colors.accent.neon} />
              <Text style={styles.organizedByText}>Organized by</Text>
              <Text style={styles.clubName}>{event.clubName}</Text>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoSection}>
            {/* Date & Time Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar-outline" size={24} color={theme.colors.accent.neon} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>
                  {event.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.infoSubValue}>{event.time}</Text>
              </View>
            </View>

            {/* Location Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location-outline" size={24} color={theme.colors.accent.neon} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{event.location}</Text>
              </View>
            </View>

            {/* Interested Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="heart-outline" size={24} color={theme.colors.accent.neon} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Interested</Text>
                <Text style={styles.infoValue}>
                  {event.interestedCount} {event.interestedCount === 1 ? 'person' : 'people'}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.interestedButton}
          activeOpacity={0.7}
          onPress={handleInterested}
        >
          <Ionicons
            name={isInterested ? 'heart' : 'heart-outline'}
            size={22}
            color={theme.colors.accent.neon}
          />
          <Text style={styles.interestedButtonText}>Interested</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.joinButton}
          activeOpacity={0.7}
          onPress={handleRegister}
        >
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.accent.magenta, theme.colors.secondary[400]]}
            style={styles.joinButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.joinButtonText}>Register Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.chat,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    width: SCREEN_WIDTH,
    height: 220,
    backgroundColor: theme.colors.card,
  },
  bannerPlaceholder: {
    width: SCREEN_WIDTH,
    height: 220,
  },
  bannerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 16,
    lineHeight: 34,
  },
  organizedByContainer: {
    marginBottom: 24,
  },
  organizedByBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91,99,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  organizedByText: {
    fontSize: 13,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  clubName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent.neon,
  },
  infoSection: {
    marginBottom: 24,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  infoSubValue: {
    fontSize: 14,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: theme.colors.text.muted,
    lineHeight: 24,
    fontWeight: '400',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 10,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  interestedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  interestedButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent.neon,
    lineHeight: 20,
  },
  joinButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  joinButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
});
