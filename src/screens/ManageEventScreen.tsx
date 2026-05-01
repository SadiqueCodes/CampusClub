import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Event, User } from '../types';
import { useStore } from '../store';
import supabase from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ManageEventScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const eventParam: Event = route.params?.event;
  const { currentUser, events, fetchEvents } = useStore();
  const event = events.find((e) => e.id === eventParam?.id) || eventParam;

  const [showEditModal, setShowEditModal] = useState(false);
  const [editedLocation, setEditedLocation] = useState(event?.location || '');
  const [editedCapacity, setEditedCapacity] = useState('50');
  const [editedDate, setEditedDate] = useState(new Date(event?.date || new Date()));
  const [editedTime, setEditedTime] = useState(() => {
    // Parse the time string from event
    const [time, period] = (event?.time || '12:00 PM').split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    const date = new Date();
    date.setHours(hour, parseInt(minutes));
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  if (!event) {
    return null;
  }

  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const load = async () => {
        try {
          await fetchEvents();
        } catch (e) {
          if (active) console.warn('ManageEvent fetchEvents error', e);
        }
      };
      load();
      const interval = setInterval(load, 4000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [fetchEvents])
  );

  useEffect(() => {
    (async () => {
      try {
        // Load profiles for registered users if available
        const registeredIds = (event as any)?.registeredUserIds || [];
        if (registeredIds && registeredIds.length) {
          const { data, error } = await supabase.from('profiles').select('*').in('id', registeredIds as string[]).limit(50);
          if (!error && data) {
            const mapped = (data as any[]).map((p) => ({ id: p.id, name: p.name, major: p.major || '', year: p.year || 'Freshman', profilePhoto: p.profile_photo || '' } as User));
            setRegisteredUsers(mapped);
            return;
          }
        }
      } catch (e) {
        console.warn('fetch registered users error', e);
      }
      // Fallback: empty list when no attendee profiles are available
      setRegisteredUsers([]);
    })();
  }, [event?.id, event?.registeredCount, JSON.stringify((event as any)?.registeredUserIds || [])]);

  const handleSaveChanges = () => {
    // Update the event in the store
    const updatedEvent = {
      ...event,
      location: editedLocation,
      date: editedDate,
      time: editedTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };

    useStore.getState().updateEvent(event.id, updatedEvent);

    // Close modal
    setShowEditModal(false);

    // Show notification
    Alert.alert(
      'Event Updated!',
      `All ${registeredUsers.length + event.interestedCount} attendees and interested users have been notified about the changes.`,
      [{ text: 'OK' }]
    );

    // Navigate back and refresh
    setTimeout(() => {
      navigation.goBack();
    }, 500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
        <Text style={styles.headerTitle}>Manage Event</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setShowEditModal(true)}
        >
          <Ionicons name="create-outline" size={22} color="#fff" />
        </TouchableOpacity>
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

          {/* Stats Cards */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle" size={28} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{Math.max(registeredUsers.length, event.registeredCount || 0)}</Text>
              <Text style={styles.statLabel}>Registered</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="heart" size={28} color="#E372A1" />
              </View>
              <Text style={styles.statValue}>{event.interestedCount}</Text>
              <Text style={styles.statLabel}>Interested</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={28} color="#6366F1" />
              </View>
              <Text style={styles.statValue}>50</Text>
              <Text style={styles.statLabel}>Capacity</Text>
            </View>
          </View>

          {/* Event Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Event Details</Text>

            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#B06579" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {event.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.detailSubValue}>{event.time}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location-outline" size={20} color="#B06579" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{event.location}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="people-outline" size={20} color="#B06579" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Organized By</Text>
                  <Text style={styles.detailValue}>{event.clubName}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Registered Users */}
          <View style={styles.registeredSection}>
            <Text style={styles.sectionTitle}>Registered Attendees</Text>

            <View style={styles.usersList}>
              {registeredUsers.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={24} color="#B06579" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userDetails}>
                      {user.major} • {user.year}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* About Section */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="fade"
        transparent
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowEditModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalRoot}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Event</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Date */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.dateTimePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#B06579" />
                  <Text style={styles.dateTimePickerText}>
                    {editedDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={editedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setEditedDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              {/* Time */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Time</Text>
                <TouchableOpacity
                  style={styles.dateTimePickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#B06579" />
                  <Text style={styles.dateTimePickerText}>
                    {editedTime.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={editedTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (selectedTime) {
                        setEditedTime(selectedTime);
                      }
                    }}
                  />
                )}
              </View>

              {/* Location */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Location</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#B06579" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={editedLocation}
                    onChangeText={setEditedLocation}
                    placeholder="Enter location"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Capacity */}
              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Capacity</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="people-outline" size={20} color="#B06579" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={editedCapacity}
                    onChangeText={setEditedCapacity}
                    placeholder="Maximum attendees"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveChanges}
              >
                <LinearGradient
                  colors={['#E372A1', '#CE678A', '#B06579']}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    width: SCREEN_WIDTH,
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  bannerPlaceholder: {
    width: SCREEN_WIDTH,
    height: 200,
  },
  bannerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 20,
    lineHeight: 32,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    marginBottom: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 30,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'center',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 24,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  registeredSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 24,
  },
  countBadge: {
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B06579',
    lineHeight: 16,
  },
  usersList: {
    gap: 10,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  userDetails: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  aboutSection: {
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
    fontWeight: '400',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  modalRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
    paddingBottom: 0,
  },
  editSection: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 14,
  },
  dateTimePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateTimePickerText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
