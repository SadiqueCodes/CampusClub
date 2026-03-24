import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store';
import { uploadImageToSupabase } from '../lib/storage';

import type { User } from '../types';

const YEAR_OPTIONS: Array<{ label: string; value: User['year'] }> = [
  { label: 'First Year', value: 'Freshman' },
  { label: 'Second Year', value: 'Sophomore' },
  { label: 'Third Year', value: 'Junior' },
  { label: 'Fourth Year', value: 'Senior' },
];
const SEMESTERS_BY_YEAR: Record<User['year'], Array<{ value: string; label: string }>> = {
  Freshman: [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
  ],
  Sophomore: [
    { value: '3', label: 'Semester 3' },
    { value: '4', label: 'Semester 4' },
  ],
  Junior: [
    { value: '5', label: 'Semester 5' },
    { value: '6', label: 'Semester 6' },
  ],
  Senior: [
    { value: '7', label: 'Semester 7' },
    { value: '8', label: 'Semester 8' },
  ],
};

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentUser, updateProfile } = useStore();

  const [name, setName] = useState(currentUser?.name ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [major, setMajor] = useState(currentUser?.major ?? '');
  const [year, setYear] = useState<'Freshman' | 'Sophomore' | 'Junior' | 'Senior'>(currentUser?.year ?? 'Freshman');
  const [semester, setSemester] = useState(currentUser?.semester ?? '1');
  const [avatar, setAvatar] = useState(currentUser?.profilePhoto);
  const [interests, setInterests] = useState<string[]>(currentUser?.interests ?? []);
  const [interestInput, setInterestInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<any>(null);

  if (!currentUser) return null;

  const semesterOptions = useMemo(() => SEMESTERS_BY_YEAR[year], [year]);
  const normalizedCurrentInterests = useMemo(
    () => [...(currentUser.interests || [])].map((i) => i.trim()).filter(Boolean).sort().join('|'),
    [currentUser.interests]
  );
  const normalizedDraftInterests = useMemo(
    () => [...interests].map((i) => i.trim()).filter(Boolean).sort().join('|'),
    [interests]
  );
  const hasUnsavedChanges = useMemo(() => {
    return (
      name.trim() !== (currentUser.name || '').trim() ||
      email.trim() !== (currentUser.email || '').trim() ||
      major.trim() !== (currentUser.major || '').trim() ||
      year !== (currentUser.year || 'Freshman') ||
      semester !== (currentUser.semester || '1') ||
      (avatar || '') !== (currentUser.profilePhoto || '') ||
      normalizedDraftInterests !== normalizedCurrentInterests
    );
  }, [
    avatar,
    currentUser.email,
    currentUser.major,
    currentUser.name,
    currentUser.profilePhoto,
    currentUser.semester,
    currentUser.year,
    email,
    major,
    name,
    normalizedCurrentInterests,
    normalizedDraftInterests,
    semester,
    year,
  ]);

  useEffect(() => {
    if (!semesterOptions.some((option) => option.value === semester)) {
      setSemester(semesterOptions[0].value);
    }
  }, [semester, semesterOptions]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges || isSaving) return;
      e.preventDefault();
      setPendingLeaveAction(e.data.action);
      setLeaveModalVisible(true);
    });
    return unsubscribe;
  }, [hasUnsavedChanges, isSaving, navigation]);

  const pickFromLibrary = async () => {
    setPhotoModalVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to change your picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setAvatar(result.assets[0].uri);
    }
  };

  const pickFromCamera = async () => {
    setPhotoModalVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setAvatar(result.assets[0].uri);
    }
  };

  const pickImage = () => setPhotoModalVisible(true);
  const removePhoto = () => {
    setPhotoModalVisible(false);
    setAvatar(undefined);
  };

  const handleSave = async (onSuccess?: () => void) => {
    setIsSaving(true);
    try {
      let profilePhotoToSave = avatar;
      if (profilePhotoToSave && /^file:\/\//i.test(profilePhotoToSave)) {
        try {
          profilePhotoToSave = await uploadImageToSupabase(profilePhotoToSave, `profiles/${currentUser.id}`);
        } catch (uploadErr: any) {
          Alert.alert('Upload failed', uploadErr?.message || 'Could not upload profile photo');
          return;
        }
      }
      await updateProfile({
        name,
        email,
        major,
        year,
        semester,
        profilePhoto: profilePhotoToSave,
        interests,
      });
      onSuccess?.();
      if (!onSuccess) {
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Save failed', err?.message || 'Could not update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackPress = () => {
    if (isSaving) return;
    if (!hasUnsavedChanges) {
      navigation.goBack();
      return;
    }
    setPendingLeaveAction(null);
    setLeaveModalVisible(true);
  };

  const leaveWithoutSaving = () => {
    setLeaveModalVisible(false);
    if (pendingLeaveAction) {
      const action = pendingLeaveAction;
      setPendingLeaveAction(null);
      navigation.dispatch(action);
      return;
    }
    navigation.goBack();
  };

  const saveAndLeave = async () => {
    await handleSave(() => {
      setLeaveModalVisible(false);
      if (pendingLeaveAction) {
        const action = pendingLeaveAction;
        setPendingLeaveAction(null);
        navigation.dispatch(action);
      } else {
        navigation.goBack();
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarCard}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarButton}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <>
                <Text style={styles.avatarInitial}>{currentUser.name.charAt(0)}</Text>
                <View style={styles.avatarAddBadge}>
                  <Ionicons name="add" size={18} color="#fff" />
                </View>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.changePhotoText}>Change photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Major</Text>
          <TextInput
            style={styles.input}
            value={major}
            onChangeText={setMajor}
            placeholder="Major"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Interests</Text>
          <View style={styles.interestsContainer}>
            {interests.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={styles.interestChip}
                onPress={() => setInterests(interests.filter((item) => item !== interest))}
              >
                <Text style={styles.interestChipText}>{interest}</Text>
                <Ionicons name="close" size={14} color="#B06579" />
              </TouchableOpacity>
            ))}
            {interests.length === 0 && (
              <Text style={styles.placeholderText}>Add a few interests (Art, Music, etc.)</Text>
            )}
          </View>
          <View style={styles.interestInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Add interest"
              value={interestInput}
              onChangeText={setInterestInput}
            />
            <TouchableOpacity
              style={[styles.addButton, !interestInput.trim() && styles.addButtonDisabled]}
              onPress={() => {
                const trimmed = interestInput.trim();
                if (!trimmed) return;
                if (interests.includes(trimmed)) return;
                setInterests([...interests, trimmed]);
                setInterestInput('');
              }}
              disabled={!interestInput.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Year</Text>
          <View style={styles.yearRow}>
            {YEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.yearChip, year === option.value && styles.yearChipActive]}
                onPress={() => setYear(option.value)}
              >
                <Text style={[styles.yearChipText, year === option.value && styles.yearChipTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Semester</Text>
          <View style={styles.yearRow}>
            {semesterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.yearChip, semester === option.value && styles.yearChipActive]}
                onPress={() => setSemester(option.value)}
              >
                <Text style={[styles.yearChipText, semester === option.value && styles.yearChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!name.trim() || !email.trim() || !semester || isSaving) && styles.saveButtonDisabled]}
          onPress={() => handleSave()}
          disabled={!name.trim() || !email.trim() || !semester || isSaving}
        >
          {isSaving ? (
            <View style={styles.saveButtonLoadingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={photoModalVisible}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPhotoModalVisible(false)}>
          <Pressable style={styles.photoModalCard} onPress={() => {}}>
            <Text style={styles.photoModalTitle}>Profile Photo</Text>
            <Text style={styles.photoModalSubtitle}>Choose how to update your profile image</Text>

            <TouchableOpacity style={styles.photoActionBtn} onPress={pickFromCamera}>
              <Ionicons name="camera-outline" size={18} color="#1F2937" />
              <Text style={styles.photoActionText}>Open Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoActionBtn} onPress={pickFromLibrary}>
              <Ionicons name="images-outline" size={18} color="#1F2937" />
              <Text style={styles.photoActionText}>Choose from Library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoActionBtn, !avatar && styles.photoActionDisabled]}
              onPress={removePhoto}
              disabled={!avatar}
            >
              <Ionicons name="trash-outline" size={18} color={avatar ? '#DC2626' : '#9CA3AF'} />
              <Text style={[styles.photoActionText, avatar ? styles.removePhotoText : styles.disabledPhotoText]}>
                Remove Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoCancelBtn} onPress={() => setPhotoModalVisible(false)}>
              <Text style={styles.photoCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={leaveModalVisible}
        onRequestClose={() => setLeaveModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setLeaveModalVisible(false)}>
          <Pressable style={styles.leaveModalCard} onPress={() => {}}>
            <Text style={styles.leaveModalTitle}>Save changes?</Text>
            <Text style={styles.leaveModalSubtitle}>
              You have unsaved profile changes. Do you want to save before leaving?
            </Text>
            <View style={styles.leaveBtnRow}>
              <TouchableOpacity style={styles.leaveNoBtn} onPress={leaveWithoutSaving}>
                <Text style={styles.leaveNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.leaveYesBtn, isSaving && styles.saveButtonDisabled]}
                onPress={saveAndLeave}
                disabled={isSaving || !name.trim() || !email.trim() || !semester}
              >
                <Text style={styles.leaveYesText}>{isSaving ? 'Saving...' : 'Yes'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  avatarCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: '800',
    color: '#B06579',
  },
  avatarAddBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#B06579',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B06579',
  },
  fieldGroup: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  input: {
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  yearRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  yearChipActive: {
    backgroundColor: '#FDF2F8',
    borderColor: '#B06579',
  },
  yearChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  yearChipTextActive: {
    color: '#B06579',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDF2F8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  interestChipText: {
    fontSize: 13,
    color: '#B06579',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  interestInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#B06579',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#B06579',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  saveButtonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.62)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  photoModalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  photoModalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  removePhotoText: {
    color: '#DC2626',
  },
  photoActionDisabled: {
    backgroundColor: '#F9FAFB',
  },
  disabledPhotoText: {
    color: '#9CA3AF',
  },
  photoCancelBtn: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  photoCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  leaveModalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  leaveModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  leaveModalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  leaveBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  leaveNoBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  leaveNoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  leaveYesBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#B06579',
    paddingVertical: 12,
    alignItems: 'center',
  },
  leaveYesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});


