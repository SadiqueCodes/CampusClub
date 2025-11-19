import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, TextInput, Alert, GestureResponderEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components';
import { SwipeCard } from '../components/SwipeCard';
import { theme } from '../theme';
import { useStore } from '../store';
import { Club, ClubType, User } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CreateClubScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState<ClubType>('Academic');
  const [clubDescription, setClubDescription] = useState('');
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

  const currentUser = useStore((state) => state.currentUser);
  const addClub = useStore((state) => state.addClub);
  const addChat = useStore((state) => state.addChat);
  const chats = useStore((state) => state.chats);
  const clubs = useStore((state) => state.clubs);

  const myClubs = useMemo(() => {
    if (!currentUser?.id) return [];
    return clubs.filter((club) => club.memberIds.includes(currentUser.id));
  }, [clubs, currentUser?.id]);

  // Mock users for swiping
  const [potentialMembers] = useState<User[]>([
    {
      id: '10',
      name: 'Sarah Johnson',
      email: 'sarah@college.edu',
      collegeId: 'CS202301',
      collegeName: 'Tech University',
      major: 'Computer Science',
      year: 'Junior',
      interests: ['Art', 'Photography', 'Design', 'Music'],
      clubsJoined: ['1', '2', '3'],
      clubsLeading: [],
      eventsAttended: 12,
      rating: 4.8,
      totalTransactions: 5,
    },
    {
      id: '11',
      name: 'Mike Chen',
      email: 'mike@college.edu',
      collegeId: 'CS202302',
      collegeName: 'Tech University',
      major: 'Mathematics',
      year: 'Senior',
      interests: ['Coding', 'Gaming', 'Sports'],
      clubsJoined: ['2'],
      clubsLeading: [],
      eventsAttended: 8,
      rating: 4.5,
      totalTransactions: 3,
    },
    {
      id: '12',
      name: 'Emma Wilson',
      email: 'emma@college.edu',
      collegeId: 'CS202303',
      collegeName: 'Tech University',
      major: 'Music',
      year: 'Sophomore',
      interests: ['Music', 'Art', 'Theater'],
      clubsJoined: ['1'],
      clubsLeading: [],
      eventsAttended: 15,
      rating: 5.0,
      totalTransactions: 7,
    },
  ]);

  const clubTypes: ClubType[] = ['Academic', 'Sports', 'Arts & Culture', 'Technology', 'Social', 'Custom'];

  const getClubChat = (clubId: string) => chats.find((chat) => chat.clubId === clubId);

  const formatLastInteraction = (date?: Date) => {
    if (!date) return 'Just created';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleOpenChat = (club: Club) => {
    const clubChat = getClubChat(club.id);
    if (!clubChat) {
      Alert.alert('Chat not ready', 'Please try again once the club chat finishes setting up.');
      return;
    }
    navigation.navigate('ClubChatDetail', { chatId: clubChat.id });
  };

  const handleCreateClub = () => {
    if (!clubName || !clubDescription || !currentUser) return;

    const newClub: Club = {
      id: Date.now().toString(),
      name: clubName,
      type: clubType,
      description: clubDescription,
      leaderId: currentUser.id,
      leaderName: currentUser.name,
      memberIds: [currentUser.id],
      memberCount: 1,
      createdAt: new Date(),
      groupChatId: `chat_${Date.now()}`,
      upcomingEvents: 0,
    };

    addClub(newClub);

    // Create group chat
    addChat({
      id: newClub.groupChatId,
      type: 'group',
      name: newClub.name,
      participantIds: [currentUser.id],
      avatarEmoji: '👥',
      lastMessage: {
        id: '1',
        chatId: newClub.groupChatId,
        senderId: 'system',
        senderName: 'System',
        text: `${newClub.name} group created!`,
        timestamp: new Date(),
      },
      lastMessageTime: new Date(),
      unreadCount: 0,
      clubId: newClub.id,
    });

    setShowCreateModal(false);
    setIsSwipeMode(true);
    setCurrentProfileIndex(0);
    resetForm();
  };

  const resetForm = () => {
    setClubName('');
    setClubDescription('');
    setClubType('Academic');
  };

  const handleSwipeLeft = () => {
    if (currentProfileIndex < potentialMembers.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    // Send join request logic would go here
    if (currentProfileIndex < potentialMembers.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    }
  };

  if (isSwipeMode) {
    return (
      <View style={styles.swipeContainer}>
        <LinearGradient
          colors={['#E372A1', '#CE678A', '#B06579']}
          style={styles.swipeHeaderGradient}
        >
          <View style={styles.swipeHeader}>
            <TouchableOpacity onPress={() => setIsSwipeMode(false)} style={styles.backButtonContainer}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.swipeTitle}>Find Members</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {currentProfileIndex + 1} / {potentialMembers.length}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.swipeCardContainer}>
          {currentProfileIndex < potentialMembers.length ? (
            <SwipeCard
              user={potentialMembers[currentProfileIndex]}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          ) : (
            <View style={styles.endCard}>
              <LinearGradient
                colors={['#E372A1', '#CE678A', '#B06579']}
                style={styles.endCardIcon}
              >
                <Ionicons name="checkmark-circle" size={60} color="#fff" />
              </LinearGradient>
              <Text style={styles.endCardTitle}>All Done!</Text>
              <Text style={styles.endCardSubtitle}>You've reviewed all potential members</Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setIsSwipeMode(false)}
              >
                <LinearGradient
                  colors={['#E372A1', '#CE678A', '#B06579']}
                  style={styles.doneButtonGradient}
                >
                  <Text style={styles.doneButtonText}>Go to My Clubs</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.swipeActions}>
          <TouchableOpacity
            style={[styles.swipeButton, styles.passButton]}
            onPress={handleSwipeLeft}
            disabled={currentProfileIndex >= potentialMembers.length}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>Swipe or tap</Text>
          </View>
          <TouchableOpacity
            style={[styles.swipeButton, styles.inviteButton]}
            onPress={handleSwipeRight}
            disabled={currentProfileIndex >= potentialMembers.length}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (myClubs.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#E372A1', '#CE678A', '#B06579']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Clubs</Text>
          </View>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#E372A1', '#CE678A', '#B06579']}
            style={styles.emptyIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="people" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Create Your First Club</Text>
          <Text style={styles.emptySubtitle}>Start building your community and connect with students who share your interests</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <LinearGradient
              colors={['#E372A1', '#CE678A', '#B06579']}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Club</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <CreateClubModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          clubName={clubName}
          setClubName={setClubName}
          clubType={clubType}
          setClubType={setClubType}
          clubDescription={clubDescription}
          setClubDescription={setClubDescription}
          clubTypes={clubTypes}
          onSubmit={handleCreateClub}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Club Chats</Text>
            <Text style={styles.headerSubtitle}>Jump back into your communities</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.clubsList} showsVerticalScrollIndicator={false}>
        {myClubs.map((club) => {
          const clubChat = getClubChat(club.id);
          const previewText = clubChat?.lastMessage
            ? `${clubChat.lastMessage.senderId === currentUser?.id ? 'You' : clubChat.lastMessage.senderName}: ${clubChat.lastMessage.text}`
            : 'Start the conversation...';
          const previewTime = formatLastInteraction(clubChat?.lastMessageTime);
          const avatarLabel = clubChat?.avatarEmoji || club.name.charAt(0).toUpperCase();

          return (
            <TouchableOpacity
              key={club.id}
              style={styles.chatCard}
              activeOpacity={0.85}
              onPress={() => handleOpenChat(club)}
            >
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>{avatarLabel}</Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName} numberOfLines={1}>{club.name}</Text>
                <Text style={styles.chatSnippet} numberOfLines={1}>{previewText}</Text>
              </View>
              <View style={styles.chatMeta}>
                <Text style={styles.chatTime}>{previewTime}</Text>
                <TouchableOpacity
                  style={styles.addMembersButton}
                  onPress={(event: GestureResponderEvent) => {
                    event.stopPropagation();
                    setIsSwipeMode(true);
                  }}
                >
                  <Ionicons name="person-add" size={16} color="#E372A1" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.createNewButton}
          onPress={() => setShowCreateModal(true)}
        >
          <View style={styles.newClubIcon}>
            <Ionicons name="add" size={18} color="#E372A1" />
          </View>
          <Text style={styles.createNewButtonText}>Create a New Club</Text>
        </TouchableOpacity>
      </ScrollView>

      <CreateClubModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        clubName={clubName}
        setClubName={setClubName}
        clubType={clubType}
        setClubType={setClubType}
        clubDescription={clubDescription}
        setClubDescription={setClubDescription}
        clubTypes={clubTypes}
        onSubmit={handleCreateClub}
      />
    </View>
  );
};

const CreateClubModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  clubName: string;
  setClubName: (val: string) => void;
  clubType: ClubType;
  setClubType: (val: ClubType) => void;
  clubDescription: string;
  setClubDescription: (val: string) => void;
  clubTypes: ClubType[];
  onSubmit: () => void;
}> = ({ visible, onClose, clubName, setClubName, clubType, setClubType, clubDescription, setClubDescription, clubTypes, onSubmit }) => {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Club</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Input
              label="Club Name"
              placeholder="Enter club name..."
              value={clubName}
              onChangeText={setClubName}
            />

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={styles.label}>Club Type</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTypePicker(!showTypePicker)}
              >
                <Text style={styles.pickerButtonText}>
                  {clubType === 'Custom' && customTypeName ? customTypeName : clubType}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {showTypePicker && (
                <View style={styles.pickerOptions}>
                      {clubTypes.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={styles.pickerOption}
                          onPress={() => {
                            setClubType(type);
                            setShowTypePicker(false);
                          }}
                        >
                          <Text style={styles.pickerOptionText}>{type}</Text>
                          {clubType === type && (
                            <Ionicons name="checkmark" size={20} color="#E372A1" />
                          )}
                        </TouchableOpacity>
                      ))}
                </View>
              )}
            </View>

            {clubType === 'Custom' && (
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={styles.label}>Custom Type Name</Text>
                <TextInput
                  style={styles.customTypeInput}
                  placeholder="Enter custom club type..."
                  placeholderTextColor="#D1D5DB"
                  value={customTypeName}
                  onChangeText={setCustomTypeName}
                />
              </View>
            )}

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Describe your club..."
                placeholderTextColor="#D1D5DB"
                value={clubDescription}
                onChangeText={setClubDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!clubName || !clubDescription) && styles.submitButtonDisabled]}
              onPress={onSubmit}
              disabled={!clubName || !clubDescription}
            >
              <Text style={styles.submitButtonText}>Create & Invite Members</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginTop: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  clubsList: {
    padding: 16,
    paddingBottom: 72,
    gap: 12,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E372A1',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  chatSnippet: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  chatMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  addMembersButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#fff',
    gap: 10,
  },
  newClubIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createNewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3436',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#2D3436',
  },
  pickerOptions: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#2D3436',
  },
  customTypeInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#2D3436',
  },
  descriptionInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#2D3436',
    height: 120,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E372A1',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 8,
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  swipeContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  swipeHeaderGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  swipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  swipeCardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  endCard: {
    alignItems: 'center',
    padding: 40,
  },
  endCardIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  endCardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 8,
  },
  endCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  doneButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  doneButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  swipeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  swipeHint: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  swipeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  passButton: {
    backgroundColor: '#EF4444',
  },
  inviteButton: {
    backgroundColor: '#10B981',
  },
});
