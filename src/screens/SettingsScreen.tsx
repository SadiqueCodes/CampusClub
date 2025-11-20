import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store';

const YEAR_OPTIONS = [
  { label: 'First Year', value: 'Freshman' },
  { label: 'Second Year', value: 'Sophomore' },
  { label: 'Third Year', value: 'Junior' },
  { label: 'Fourth Year', value: 'Senior' },
];

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentUser, setCurrentUser } = useStore();

  const [name, setName] = useState(currentUser?.name ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [major, setMajor] = useState(currentUser?.major ?? '');
  const [collegeId, setCollegeId] = useState(currentUser?.collegeId ?? '');
  const [year, setYear] = useState<'Freshman' | 'Sophomore' | 'Junior' | 'Senior'>(currentUser?.year ?? 'Freshman');
  const [avatar, setAvatar] = useState(currentUser?.profilePhoto);
  const [interests, setInterests] = useState<string[]>(currentUser?.interests ?? []);
  const [interestInput, setInterestInput] = useState('');

  if (!currentUser) return null;

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to change your picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    setCurrentUser({
      ...currentUser,
      name,
      email,
      major,
      collegeId,
      year,
      profilePhoto: avatar,
      interests,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
              <Text style={styles.avatarInitial}>{currentUser.name.charAt(0)}</Text>
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
          <Text style={styles.label}>College ID</Text>
          <TextInput
            style={styles.input}
            value={collegeId}
            onChangeText={setCollegeId}
            placeholder="Student ID"
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

        <TouchableOpacity
          style={[styles.saveButton, (!name.trim() || !email.trim()) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || !email.trim()}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: '800',
    color: '#B06579',
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
});
