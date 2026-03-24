import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Image,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore } from '../store';
import { Club } from '../types';

export const AddEventScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const clubs = useStore((state) => state.clubs);
  const createEvent = useStore((state) => state.createEvent);
  const currentUser = useStore((state) => state.currentUser);

  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showClubSelector, setShowClubSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const allowProgrammaticLeaveRef = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isSaving || allowProgrammaticLeaveRef.current) return;
      e.preventDefault();
    });
    return unsubscribe;
  }, [navigation, isSaving]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.65,
    });

    if (!result.canceled) {
      setPosterImage(result.assets[0].uri);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Missing info', 'Please enter an event name.');
      return;
    }
    if (!selectedClub) {
      Alert.alert('Select a club', 'Choose which club is hosting this event.');
      return;
    }
    if (!currentUser) {
      Alert.alert('Not signed in', 'You must be logged in to create an event.');
      return;
    }

    const formattedTime = time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    setIsSaving(true);
    allowProgrammaticLeaveRef.current = false;
    try {
      await createEvent({
        title: eventName.trim(),
        description: description.trim() || 'No description provided',
        clubId: selectedClub.id,
        clubName: selectedClub.name,
        date,
        time: formattedTime,
        location: location.trim() || 'TBA',
        bannerImage: posterImage,
      });
      allowProgrammaticLeaveRef.current = true;
      navigation.goBack();
    } catch (err: any) {
      console.error('handleCreateEvent error', err);
      const msg = String(err?.message || '');
      if (msg.includes('42501') || msg.toLowerCase().includes('row-level security')) {
        Alert.alert('Permission blocked', 'Event create was blocked by database policy. Refresh profile/college info or use backend mode.');
      } else {
        Alert.alert('Could not create event', 'Please try again in a moment.');
      }
    } finally {
      setIsSaving(false);
      allowProgrammaticLeaveRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
        style={styles.header}
      >
        <TouchableOpacity
          style={[styles.backButton, isSaving && styles.backButtonDisabled]}
          onPress={() => {
            if (isSaving) return;
            navigation.goBack();
          }}
          disabled={isSaving}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Poster Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Poster</Text>
          <TouchableOpacity style={styles.posterUpload} onPress={pickImage}>
            {posterImage ? (
              <Image source={{ uri: posterImage }} style={styles.posterImage} />
            ) : (
              <View style={styles.posterPlaceholder}>
                <View style={styles.uploadIconContainer}>
                  <Ionicons name="image-outline" size={40} color="#B06579" />
                </View>
                <Text style={styles.uploadText}>Upload Event Poster</Text>
                <Text style={styles.uploadSubtext}>Recommended: 16:9 ratio</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Event Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter event name"
            placeholderTextColor="#9CA3AF"
            value={eventName}
            onChangeText={setEventName}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about your event..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Organized By */}
        <View style={styles.section}>
          <Text style={styles.label}>Organized By</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowClubSelector(true)}
          >
            <Ionicons name="people-outline" size={20} color="#B06579" />
            <Text style={[styles.selectorText, !selectedClub && styles.placeholderText]}>
              {selectedClub ? selectedClub.name : 'Select a club'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Capacity */}
        <View style={styles.section}>
          <Text style={styles.label}>Capacity</Text>
          <TextInput
            style={styles.input}
            placeholder="Maximum attendees"
            placeholderTextColor="#9CA3AF"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="location-outline" size={20} color="#B06579" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithPadding]}
              placeholder="Enter event location"
              placeholderTextColor="#9CA3AF"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#B06579" />
            <Text style={styles.dateTimeText}>
              {date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="#B06579" />
            <Text style={styles.dateTimeText}>
              {time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  setTime(selectedTime);
                }
              }}
            />
          )}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isSaving && { opacity: 0.7 }]}
          onPress={handleCreateEvent}
          disabled={isSaving}
        >
          <LinearGradient
            colors={['#E372A1', '#CE678A', '#B06579']}
            style={styles.createButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.createButtonText}>{isSaving ? 'Creating...' : 'Create Event'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Club Selector Modal */}
      <Modal
        visible={showClubSelector}
        animationType="fade"
        transparent={true}
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowClubSelector(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowClubSelector(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalRoot}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Club</Text>
              <TouchableOpacity onPress={() => setShowClubSelector(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.clubList}>
              {clubs.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.clubOption}
                  onPress={() => {
                    setSelectedClub(club);
                    setShowClubSelector(false);
                  }}
                >
                  <View style={styles.clubOptionContent}>
                    <View style={styles.clubIconContainer}>
                      <Ionicons name="people" size={20} color="#B06579" />
                    </View>
                    <View style={styles.clubInfo}>
                      <Text style={styles.clubOptionName}>{club.name}</Text>
                      <Text style={styles.clubOptionType}>{club.type}</Text>
                    </View>
                  </View>
                  {selectedClub?.id === club.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#B06579" />
                  )}
                </TouchableOpacity>
              ))}
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
  backButtonDisabled: {
    opacity: 0.55,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  posterUpload: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputWithPadding: {
    paddingLeft: 46,
  },
  dateTimeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateTimeText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  createButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  selectorButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9CA3AF',
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
    maxHeight: '70%',
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
  clubList: {
    paddingHorizontal: 20,
  },
  clubOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  clubOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  clubIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: {
    flex: 1,
  },
  clubOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  clubOptionType: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
