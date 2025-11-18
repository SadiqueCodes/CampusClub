import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components';
import { theme } from '../theme';
import { useStore } from '../store';
import { Club, ClubType, User, JoinRequest } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ROSE_GRADIENT = ['#E372A1', '#CE678A', '#B06579'] as const;
const ROSE_ACCENT = '#E372A1';
const ROSE_BACKGROUND = '#FFF5F8';
const ROSE_MIST = '#FFE8F0';
const ROSE_BORDER = '#F5CEDD';
const ROSE_TEXT = '#2D3436';
const ROSE_PLACEHOLDER = '#F3AFC4';

type YearFilter = User['year'] | 'All';
type MajorFilter = string | 'All';
type InterestFilter = string | 'All';

export const CreateClubScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState<ClubType>('Academic');
  const [clubDescription, setClubDescription] = useState('');
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<YearFilter>('All');
  const [selectedMajor, setSelectedMajor] = useState<MajorFilter>('All');
  const [selectedInterest, setSelectedInterest] = useState<InterestFilter>('All');
  const [showFilters, setShowFilters] = useState(false);

  const { currentUser, myClubs, addClub, addChat, addJoinRequest, joinRequests, chats } = useStore();

  // Mock user directory for invitations
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

  const yearOptions: YearFilter[] = ['All', 'Freshman', 'Sophomore', 'Junior', 'Senior'];

  const majorOptions = useMemo<MajorFilter[]>(() => {
    const majors = Array.from(new Set(potentialMembers.map((member) => member.major)));
    return ['All', ...majors];
  }, [potentialMembers]);

  const interestOptions = useMemo<InterestFilter[]>(() => {
    const interests = new Set<string>();
    potentialMembers.forEach((member) => member.interests.forEach((interest) => interests.add(interest)));
    return ['All', ...Array.from(interests)];
  }, [potentialMembers]);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return potentialMembers
      .filter((member) => {
        const matchesSearch =
          query.length === 0 ||
          member.name.toLowerCase().includes(query) ||
          member.major.toLowerCase().includes(query) ||
          member.interests.some((interest) => interest.toLowerCase().includes(query));

        const matchesYear = selectedYear === 'All' || member.year === selectedYear;
        const matchesMajor = selectedMajor === 'All' || member.major === selectedMajor;
        const matchesInterest =
          selectedInterest === 'All' || member.interests.includes(selectedInterest);

        return matchesSearch && matchesYear && matchesMajor && matchesInterest;
      })
      .sort((a, b) => {
        if (b.eventsAttended === a.eventsAttended) {
          return b.rating - a.rating;
        }
        return b.eventsAttended - a.eventsAttended;
      });
  }, [potentialMembers, searchQuery, selectedYear, selectedMajor, selectedInterest]);

  const clubTypes: ClubType[] = ['Academic', 'Sports', 'Arts & Culture', 'Technology', 'Social', 'Custom'];

  const pendingRequestsByClub = useMemo(() => {
    return joinRequests.reduce<Record<string, number>>((acc, request) => {
      if (request.status === 'pending') {
        acc[request.clubId] = (acc[request.clubId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [joinRequests]);

  const getClubInitials = (club: Club) => {
    const initials: string[] = [];
    if (club.leaderName) {
      initials.push(club.leaderName.charAt(0).toUpperCase());
    }
    club.memberIds.forEach((memberId, index) => {
      if (initials.length >= 4) return;
      if (memberId === club.leaderId) return;
      initials.push(`M${index + 1}`);
    });
    if (initials.length === 0 && currentUser) {
      initials.push(currentUser.name.charAt(0).toUpperCase());
    }
    return initials.slice(0, 4);
  };

  const clubChats = useMemo(() => {
    const ids = myClubs.map((club) => club.id);
    return chats.filter((chat) => chat.clubId && ids.includes(chat.clubId));
  }, [chats, myClubs]);

  const openMemberFinder = (club: Club) => {
    setSelectedClub(club);
    setIsSwipeMode(true);
    setSearchQuery('');
    setSelectedYear('All');
    setSelectedMajor('All');
    setSelectedInterest('All');
  };

  const closeMemberFinder = () => {
    setIsSwipeMode(false);
    setSelectedClub(null);
  };

  const handleSendRequest = (member: User) => {
    if (!selectedClub || !currentUser) return;

    if (hasPendingRequest(member.id)) return;

    const request: JoinRequest = {
      id: `request_${Date.now()}`,
      clubId: selectedClub.id,
      userId: member.id,
      userName: member.name,
      userPhoto: member.profilePhoto,
      status: 'pending',
      createdAt: new Date(),
    };

    addJoinRequest(request);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedYear('All');
    setSelectedMajor('All');
    setSelectedInterest('All');
    setShowFilters(false);
  };

  const openClubChat = (club: Club) => {
    navigation.navigate('Chat', {
      screen: 'ChatDetail',
      params: { chatId: club.groupChatId },
    });
  };

  const hasPendingRequest = (memberId: string) => {
    if (!selectedClub) return false;
    return joinRequests.some(
      (request) => request.clubId === selectedClub.id && request.userId === memberId
    );
  };

  const hasActiveFilters =
    selectedYear !== 'All' || selectedMajor !== 'All' || selectedInterest !== 'All';

  const handleYearFilterSelect = (year: YearFilter) => {
    if (year === 'All' || selectedYear === year) {
      setSelectedYear('All');
    } else {
      setSelectedYear(year);
    }
  };

  const handleMajorFilterSelect = (major: MajorFilter) => {
    if (major === 'All' || selectedMajor === major) {
      setSelectedMajor('All');
    } else {
      setSelectedMajor(major);
    }
  };

  const handleInterestFilterSelect = (interest: InterestFilter) => {
    if (interest === 'All' || selectedInterest === interest) {
      setSelectedInterest('All');
    } else {
      setSelectedInterest(interest);
    }
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
    openMemberFinder(newClub);
    resetForm();
  };

  const resetForm = () => {
    setClubName('');
    setClubDescription('');
    setClubType('Academic');
  };

  if (isSwipeMode) {
    return (
      <View style={styles.memberFinderContainer}>
        <LinearGradient
          colors={ROSE_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.memberFinderHeader}
        >
          <TouchableOpacity onPress={closeMemberFinder} style={styles.backButtonContainer}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.memberFinderTitleWrapper}>
            <Text style={styles.memberFinderTitle}>Invite Members</Text>
            <Text style={styles.memberFinderSubtitle}>
              {selectedClub ? `For ${selectedClub.name}` : 'Choose a club to invite members'}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        {!selectedClub ? (
          <View style={styles.noClubSelected}>
            <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyMembersTitle}>Select a club to invite members</Text>
            <Text style={styles.emptyMembersSubtitle}>
              Pick a club from your list and we will pull up tailored member suggestions.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.toolsRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={ROSE_ACCENT} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, major, hobby"
                  placeholderTextColor={ROSE_PLACEHOLDER}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={ROSE_PLACEHOLDER} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Ionicons
                  name="options-outline"
                  size={18}
                  color={showFilters ? '#fff' : ROSE_ACCENT}
                />
                <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>
                  Filters
                </Text>
                {hasActiveFilters && <View style={styles.filterBadge} />}
              </TouchableOpacity>
            </View>

            {showFilters && (
              <View style={styles.filterSection}>
                <View style={styles.filterHeader}>
                  <Text style={styles.filterTitle}>Filters</Text>
                  <TouchableOpacity onPress={handleResetFilters}>
                    <Text style={styles.resetFilters}>Reset</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Year</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipRow}
                  >
                    {yearOptions.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.filterChip,
                          selectedYear === year && styles.filterChipActive,
                        ]}
                        onPress={() => handleYearFilterSelect(year)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedYear === year && styles.filterChipTextActive,
                          ]}
                        >
                          {year === 'All' ? 'Any' : year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Major</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipRow}
                  >
                    {majorOptions.map((major) => (
                      <TouchableOpacity
                        key={major}
                        style={[
                          styles.filterChip,
                          selectedMajor === major && styles.filterChipActive,
                        ]}
                        onPress={() => handleMajorFilterSelect(major)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedMajor === major && styles.filterChipTextActive,
                          ]}
                        >
                          {major === 'All' ? 'Any' : major}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Interests</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipRow}
                  >
                    {interestOptions.map((interest) => (
                      <TouchableOpacity
                        key={interest}
                        style={[
                          styles.filterChip,
                          selectedInterest === interest && styles.filterChipActive,
                        ]}
                        onPress={() => handleInterestFilterSelect(interest)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedInterest === interest && styles.filterChipTextActive,
                          ]}
                        >
                          {interest === 'All' ? 'Any' : interest}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            <ScrollView contentContainerStyle={styles.memberList} showsVerticalScrollIndicator={false}>
              {filteredMembers.length === 0 ? (
                <View style={styles.emptyMembers}>
                  <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyMembersTitle}>No students match your filters</Text>
                  <Text style={styles.emptyMembersSubtitle}>
                    Try adjusting your search to find more members.
                  </Text>
                </View>
              ) : (
                filteredMembers.map((member) => {
                  const requestSent = hasPendingRequest(member.id);

                  return (
                    <View key={member.id} style={styles.memberCard}>
                      <View style={styles.memberHeader}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{member.name.charAt(0)}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberMeta}>
                            {member.major} • {member.year}
                          </Text>
                        </View>
                        <View style={styles.memberStatBadge}>
                          <Ionicons name="trophy-outline" size={12} color="#fff" />
                          <Text style={styles.memberStatText}>{member.eventsAttended} events</Text>
                        </View>
                      </View>

                      <Text style={styles.memberBio}>
                        Passionate about {member.interests.slice(0, 3).join(', ')}
                      </Text>

                      <View style={styles.memberTags}>
                        {member.interests.slice(0, 4).map((interest) => (
                          <View key={interest} style={styles.tagPill}>
                            <Text style={styles.tagPillText}>{interest}</Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.memberFooter}>
                        <View style={styles.memberStats}>
                          <Ionicons name="people-outline" size={14} color="#6B7280" />
                          <Text style={styles.memberStatsText}>
                            {member.clubsJoined.length} clubs joined
                          </Text>
                        </View>
                        {requestSent ? (
                          <View style={[styles.requestButton, styles.requestButtonDisabled]}>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text style={styles.requestButtonDisabledText}>Request Sent</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.requestButton}
                            onPress={() => handleSendRequest(member)}
                          >
                            <LinearGradient
                              colors={ROSE_GRADIENT}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.requestButtonGradient}
                            >
                              <Ionicons name="send" size={16} color="#fff" />
                              <Text style={styles.requestButtonText}>Send Request</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </>
        )}
      </View>
    );
  }

  if (myClubs.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={ROSE_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create a Club</Text>
          </View>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={ROSE_GRADIENT}
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
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Club</Text>
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
        colors={ROSE_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Clubs</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color={ROSE_ACCENT} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.clubsList}>
        {myClubs.map((club) => {
          const memberInitials = getClubInitials(club);
          const pendingCount = pendingRequestsByClub[club.id] || 0;

          return (
            <View key={club.id} style={styles.clubCard}>
              <LinearGradient
                colors={ROSE_GRADIENT}
                style={styles.clubCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="people" size={28} color="#fff" />
              </LinearGradient>
              <View style={styles.clubInfo}>
                <Text style={styles.clubCardTitle}>{club.name}</Text>
                <View style={styles.clubStatsRow}>
                  <View style={styles.clubStatItem}>
                    <Ionicons name="people-outline" size={14} color="#6B7280" />
                    <Text style={styles.clubStatText}>{club.memberCount} members</Text>
                  </View>
                  <View style={styles.clubStatItem}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.clubStatText}>{club.upcomingEvents} events</Text>
                  </View>
                </View>
                <View style={styles.chatMetaRow}>
                  <View style={styles.avatarStack}>
                    {memberInitials.map((initial, index) => (
                      <View
                        key={`${club.id}-${initial}-${index}`}
                        style={[
                          styles.avatarBubble,
                          { marginLeft: index === 0 ? 0 : -10, zIndex: memberInitials.length - index },
                        ]}
                      >
                        <Text style={styles.avatarBubbleText}>{initial}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.chatAdminText}>{club.leaderName || currentUser?.name || 'You'} • Admin</Text>
                  {pendingCount > 0 && (
                    <Text style={styles.pendingText}>{pendingCount} pending</Text>
                  )}
                </View>
                <View style={styles.chatActionsRow}>
                  <TouchableOpacity
                    style={styles.openChatButton}
                    onPress={() => openClubChat(club)}
                  >
                    <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                    <Text style={styles.openChatButtonText}>Open Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addMembersButton}
                    onPress={() => openMemberFinder(club)}
                  >
                    <Ionicons name="person-add" size={18} color={ROSE_ACCENT} />
                    <Text style={styles.addMembersText}>Invite</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.createNewButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color={ROSE_ACCENT} />
          <Text style={styles.createNewButtonText}>Create New Club</Text>
        </TouchableOpacity>

        {clubChats.length > 0 && (
          <View style={styles.chatSection}>
            <View style={styles.chatSectionHeader}>
              <Text style={styles.chatSectionTitle}>Club Chats</Text>
              <Text style={styles.chatSectionSub}> {clubChats.length} active </Text>
            </View>
            {clubChats.map((chat, index) => {
              const lastMessage = chat.lastMessage?.text || 'Start the conversation';
              const prefix =
                chat.lastMessage && chat.lastMessage.senderId === currentUser?.id ? 'You: ' : '';
              const lastTime = chat.lastMessageTime
                ? chat.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now';
              return (
                <TouchableOpacity
                  key={chat.id}
                  style={[
                    styles.chatCard,
                    index === clubChats.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 },
                  ]}
                  onPress={() =>
                    navigation.navigate('Chat', {
                      screen: 'ChatDetail',
                      params: { chatId: chat.id },
                    })
                  }
                >
                  <View style={styles.chatCardAvatar}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={ROSE_ACCENT} />
                  </View>
                  <View style={styles.chatCardInfo}>
                    <Text style={styles.chatCardTitle}>{chat.name || 'Club Chat'}</Text>
                    <Text style={styles.chatCardMeta}>
                      {prefix}
                      {lastMessage}
                    </Text>
                  </View>
                  <Text style={styles.chatCardTime}>{lastTime}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
                        <Ionicons name="checkmark" size={20} color={ROSE_ACCENT} />
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
    backgroundColor: ROSE_BACKGROUND,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: ROSE_ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
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
    shadowColor: ROSE_ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ROSE_ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: ROSE_ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  clubsList: {
    padding: 20,
    paddingBottom: 100,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ROSE_BORDER,
    shadowColor: ROSE_ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  clubCardGradient: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  clubInfo: {
    flex: 1,
  },
  clubCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 6,
  },
  clubStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  clubStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clubStatText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  chatMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(227, 114, 161, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  avatarBubbleText: {
    fontSize: 13,
    fontWeight: '600',
    color: ROSE_ACCENT,
  },
  chatAdminText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  pendingText: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '600',
  },
  chatActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  openChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ROSE_ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: ROSE_ACCENT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  openChatButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  addMembersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(227,114,161,0.1)',
    borderWidth: 1,
    borderColor: ROSE_ACCENT,
  },
  addMembersText: {
    fontSize: 13,
    fontWeight: '600',
    color: ROSE_ACCENT,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ROSE_MIST,
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: ROSE_ACCENT,
    borderStyle: 'dashed',
    gap: 8,
  },
  createNewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ROSE_ACCENT,
    marginLeft: 8,
  },
  chatSection: {
    marginTop: 32,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: ROSE_BORDER,
    ...theme.shadows.sm,
  },
  chatSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chatSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ROSE_TEXT,
  },
  chatSectionSub: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: ROSE_MIST,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatCardInfo: {
    flex: 1,
  },
  chatCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ROSE_TEXT,
  },
  chatCardMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  chatCardTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
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
    backgroundColor: ROSE_ACCENT,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 8,
    shadowColor: ROSE_ACCENT,
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
  memberFinderContainer: {
    flex: 1,
    backgroundColor: ROSE_BACKGROUND,
    paddingBottom: 24,
  },
  memberFinderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: ROSE_ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberFinderTitleWrapper: {
    flex: 1,
    marginLeft: 16,
  },
  memberFinderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  memberFinderSubtitle: {
    fontSize: 13,
    color: ROSE_MIST,
    marginTop: 4,
  },
  headerSpacer: {
    width: 40,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: ROSE_BORDER,
    ...theme.shadows.none,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: ROSE_TEXT,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: ROSE_MIST,
    borderWidth: 1.5,
    borderColor: ROSE_BORDER,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: ROSE_ACCENT,
    borderColor: ROSE_ACCENT,
  },
  filterButtonText: {
    color: ROSE_ACCENT,
    fontWeight: '600',
    fontSize: 13,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  filterSection: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ROSE_BORDER,
    ...theme.shadows.sm,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  resetFilters: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
  filterGroup: {
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  filterChipRow: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ROSE_BORDER,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: ROSE_MIST,
    borderColor: ROSE_ACCENT,
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: ROSE_ACCENT,
    fontWeight: '600',
  },
  memberList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ROSE_BORDER,
    ...theme.shadows.sm,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: ROSE_MIST,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: ROSE_ACCENT,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  memberMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  memberStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ROSE_ACCENT,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...theme.shadows.none,
  },
  memberStatText: {
    fontSize: 11,
    color: '#fff',
    marginLeft: 6,
  },
  memberBio: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 8,
  },
  memberTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tagPillText: {
    fontSize: 12,
    color: '#4B5563',
  },
  memberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberStatsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  requestButton: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  requestButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
  },
  requestButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  requestButtonDisabled: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
  },
  requestButtonDisabledText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  emptyMembers: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyMembersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMembersSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  noClubSelected: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
});
