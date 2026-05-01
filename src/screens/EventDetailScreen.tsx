import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../types';
import { useStore } from '../store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const EventDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const eventParam: Event | undefined = route.params?.event;
  const eventIdParam: string | undefined = route.params?.eventId;
  const { currentUser, toggleEventInterest, toggleEventRegistration, events, fetchEvents } = useStore();

  // Get the latest event data from store
  const resolvedEventId = eventParam?.id || eventIdParam;
  const event = events.find((e) => e.id === resolvedEventId) || eventParam;
  const isCreator = !!(currentUser?.id && event?.createdBy === currentUser.id);
  const isInterested = !!(event?.interestedUserIds || []).includes(currentUser?.id || '');
  const isRegistered = !!(event?.registeredUserIds || []).includes(currentUser?.id || '');
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupIcon, setPopupIcon] = useState<'heart' | 'checkmark-circle' | 'information-circle'>('information-circle');

  useEffect(() => {
    if (!event && resolvedEventId) {
      fetchEvents();
    }
  }, [event, resolvedEventId, fetchEvents]);

  if (!event) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#E372A1" />
      </View>
    );
  }

  const showPopup = (
    title: string,
    message: string,
    icon: 'heart' | 'checkmark-circle' | 'information-circle'
  ) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupIcon(icon);
    setPopupVisible(true);
  };

  const handleInterested = () => {
    if (isCreator) {
      showPopup('Your Event', 'You created this event.', 'information-circle');
      return;
    }
    if (currentUser) {
      toggleEventInterest(event.id, currentUser.id);
      showPopup(
        isInterested ? 'Removed' : 'Added!',
        isInterested
          ? 'Removed from interested list'
          : 'Marked as interested! You will be notified of any updates.',
        isInterested ? 'information-circle' : 'heart'
      );
    }
  };

  const handleRegister = () => {
    if (isCreator) {
      showPopup('Your Event', 'You created this event.', 'information-circle');
      return;
    }
    if (currentUser) {
      toggleEventRegistration(event.id, currentUser.id);
    }
    showPopup(
      isRegistered ? 'Registration Removed' : 'Registration Successful!',
      isRegistered ? 'You are no longer registered for this event.' : 'You have been registered for this event.',
      'checkmark-circle'
    );
  };

  const handleOpenManageEvent = () => {
    if (!event) return;
    // ManageEvent lives inside the Events tab stack, not Home stack.
    navigation.navigate('Events', {
      screen: 'ManageEvent',
      params: { event },
    });
  };

  const handleShareEvent = async () => {
    try {
      const dateLabel = event.date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const lines = [
        `Check out this event: ${event.title}`,
        `Club: ${event.clubName}`,
        `Date: ${dateLabel}`,
        `Time: ${event.time}`,
        `Location: ${event.location}`,
      ];
      if (event.bannerImage && /^https?:\/\//i.test(event.bannerImage)) {
        lines.push(`Poster: ${event.bannerImage}`);
      }
      lines.push(`Open in CampusClub: campusclub://event/${event.id}`);
      await Share.share({ message: lines.join('\n') });
    } catch (err) {
      showPopup('Share Failed', 'Could not open share options right now.', 'information-circle');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={styles.headerRightActions}>
          {isCreator && (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleOpenManageEvent}
            >
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.shareButton} onPress={handleShareEvent}>
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Event Banner */}
        {event.bannerImage ? (
          <Image source={{ uri: event.bannerImage }} style={styles.banner} />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <LinearGradient
              colors={['#E372A1', '#CE678A', '#B06579']}
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
              <Ionicons name="people" size={16} color="#B06579" />
              <Text style={styles.organizedByText}>Organized by</Text>
              <Text style={styles.clubName}>{event.clubName}</Text>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoSection}>
            {/* Date & Time Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#B06579" />
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
                <Ionicons name="location-outline" size={24} color="#B06579" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{event.location}</Text>
              </View>
            </View>

            {/* Registered Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#B06579" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Registered</Text>
                <Text style={styles.infoValue}>
                  {event.registeredCount} {event.registeredCount === 1 ? 'person' : 'people'}
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
            color="#B06579"
          />
          <Text style={styles.interestedButtonText}>Interested</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.joinButton}
          activeOpacity={0.7}
          onPress={handleRegister}
        >
          <LinearGradient
            colors={['#E372A1', '#CE678A', '#B06579']}
            style={styles.joinButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.joinButtonText}>{isRegistered ? 'Registered' : 'Register Now'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal
        visible={popupVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setPopupVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPopupVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name={popupIcon} size={26} color="#B06579" />
            </View>

            <Text style={styles.modalTitle}>{popupTitle}</Text>
            <Text style={styles.modalMessage}>{popupMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setPopupVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
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
    color: '#fff',
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
    backgroundColor: '#F3F4F6',
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
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 34,
  },
  organizedByContainer: {
    marginBottom: 24,
  },
  organizedByBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  organizedByText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  clubName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B06579',
  },
  infoSection: {
    marginBottom: 24,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  infoSubValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
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
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  interestedButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B06579',
    lineHeight: 20,
  },
  joinButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#B06579',
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  joinButtonGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  modalButton: {
    minWidth: 120,
    backgroundColor: '#B06579',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
