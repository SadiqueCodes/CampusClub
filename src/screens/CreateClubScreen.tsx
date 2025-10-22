import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Button, Input, Card } from '../components';
import { SwipeCard } from '../components/SwipeCard';
import { theme } from '../theme';
import { useStore } from '../store';
import { Club, ClubType, User } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CreateClubScreen: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState<ClubType>('Academic');
  const [clubDescription, setClubDescription] = useState('');
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

  const { currentUser, myClubs, addClub, addChat } = useStore();

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

  const clubTypes: ClubType[] = ['Academic', 'Sports', 'Arts & Culture', 'Technology', 'Social', 'Other'];

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
        <View style={styles.swipeHeader}>
          <TouchableOpacity onPress={() => setIsSwipeMode(false)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.swipeTitle}>Find Members</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.swipeCardContainer}>
          {currentProfileIndex < potentialMembers.length ? (
            <SwipeCard
              user={potentialMembers[currentProfileIndex]}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          ) : (
            <Card style={styles.endCard}>
              <Text style={styles.endCardText}>🎉</Text>
              <Text style={styles.endCardTitle}>All Done!</Text>
              <Text style={styles.endCardSubtitle}>You've reviewed all potential members</Text>
              <Button
                title="Go to My Clubs"
                onPress={() => setIsSwipeMode(false)}
                backgroundColor={theme.colors.blue.indigo}
                style={{ marginTop: theme.spacing.lg }}
              />
            </Card>
          )}
        </View>

        <View style={styles.swipeActions}>
          <TouchableOpacity
            style={[styles.swipeButton, styles.passButton]}
            onPress={handleSwipeLeft}
            disabled={currentProfileIndex >= potentialMembers.length}
          >
            <Text style={styles.swipeButtonText}>✖ PASS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.swipeButton, styles.inviteButton]}
            onPress={handleSwipeRight}
            disabled={currentProfileIndex >= potentialMembers.length}
          >
            <Text style={styles.swipeButtonText}>✓ INVITE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (myClubs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>➕ Create a Club</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>CREATE YOUR FIRST CLUB</Text>
          <Text style={styles.emptySubtitle}>Start building your community</Text>
          <Button
            title="+ CREATE"
            onPress={() => setShowCreateModal(true)}
            backgroundColor={theme.colors.blue.indigo}
            style={styles.createButton}
          />
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎯 Your Clubs</Text>
      </View>

      <ScrollView contentContainerStyle={styles.clubsList}>
        {myClubs.map((club) => (
          <Card key={club.id} style={styles.clubCard}>
            <View style={styles.clubHeader}>
              <View>
                <Text style={styles.clubCardTitle}>{club.name}</Text>
                <Text style={styles.clubStats}>👥 {club.memberCount} members</Text>
                <Text style={styles.clubStats}>📅 {club.upcomingEvents} upcoming events</Text>
              </View>
              <TouchableOpacity
                style={styles.addMembersButton}
                onPress={() => setIsSwipeMode(true)}
              >
                <Text style={styles.addMembersText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.clubActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Manage Events</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        <Button
          title="+ CREATE NEW CLUB"
          onPress={() => setShowCreateModal(true)}
          variant="outline"
          style={styles.createNewButton}
        />
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Club</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
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
              <Text style={styles.label}>Club Type:</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTypePicker(!showTypePicker)}
              >
                <Text style={styles.pickerButtonText}>{clubType}</Text>
                <Text>▼</Text>
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
                      <Text style={styles.pickerOptionText}>• {type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Input
              label="Description"
              placeholder="Enter description..."
              value={clubDescription}
              onChangeText={setClubDescription}
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top' }}
            />

            <Button
              title="CREATE & INVITE →"
              onPress={onSubmit}
              backgroundColor={theme.colors.blue.indigo}
              disabled={!clubName || !clubDescription}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.create,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.darkGrey,
    marginBottom: theme.spacing.xl,
  },
  createButton: {
    minWidth: 200,
  },
  clubsList: {
    padding: theme.spacing.lg,
  },
  clubCard: {
    marginBottom: theme.spacing.md,
  },
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  clubCardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
    marginBottom: theme.spacing.xs,
  },
  clubStats: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.darkGrey,
    marginBottom: theme.spacing.xs,
  },
  addMembersButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.blue.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMembersText: {
    fontSize: 24,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
  },
  clubActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.blue.indigo,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.blue.indigo,
    fontWeight: theme.fontWeight.semibold,
  },
  createNewButton: {
    marginTop: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: SCREEN_HEIGHT * 0.8,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
  },
  closeButton: {
    fontSize: 24,
    color: theme.colors.text.darkGrey,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.dark,
    marginBottom: theme.spacing.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  pickerButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.dark,
  },
  pickerOptions: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.white,
  },
  pickerOption: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerOptionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.dark,
  },
  swipeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.create,
  },
  swipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
  },
  backButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.dark,
    fontWeight: theme.fontWeight.semibold,
  },
  swipeTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
  },
  swipeCardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  endCard: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  endCardText: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  endCardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
    marginBottom: theme.spacing.sm,
  },
  endCardSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.darkGrey,
    textAlign: 'center',
  },
  swipeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  swipeButton: {
    width: 120,
    height: 60,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  passButton: {
    backgroundColor: theme.colors.error,
  },
  inviteButton: {
    backgroundColor: theme.colors.success,
  },
  swipeButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
});
