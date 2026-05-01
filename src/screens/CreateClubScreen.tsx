import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Dimensions, TextInput, Alert, GestureResponderEvent, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components';
import { SwipeCard } from '../components/SwipeCard';
import { theme } from '../theme';
import { useStore } from '../store';
import supabase from '../lib/supabase';
import api, { isBackendConfigured } from '../lib/api';
import { Club, ClubType, User } from '../types';
import { getMarketplaceBucketName } from '../lib/storage';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const toStringArray = (value: any): string[] => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch {}
    return trimmed
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
};

const resolveProfilePhotoUrl = async (value: any): Promise<string | undefined> => {
  const raw = String(value || '').trim();
  if (!raw) return undefined;
  if (/^(https?:\/\/|file:\/\/|content:\/\/|data:|blob:)/i.test(raw)) return raw;
  if (raw.includes('/storage/v1/object/public/')) return raw;

  const path = raw.replace(/^\/+/, '');
  const bucket = getMarketplaceBucketName();

  // Works for private buckets.
  const { data: signedData, error: signedErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);
  if (!signedErr && signedData?.signedUrl) return signedData.signedUrl;

  // Fallback for public buckets.
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicData?.publicUrl || undefined;
};

export const CreateClubScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState<ClubType>('Academic');
  const [clubDescription, setClubDescription] = useState('');
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [showInterestMenu, setShowInterestMenu] = useState(false);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [filterMenuCoords, setFilterMenuCoords] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const filterButtonRef = useRef<any>(null);
  const createClubInFlightRef = useRef(false);

  const currentUser = useStore((state) => state.currentUser);
  const updateProfile = useStore((state) => state.updateProfile);
  const addClub = useStore((state) => state.addClub);
  const addChat = useStore((state) => state.addChat);
  const chats = useStore((state) => state.chats);
  const clubs = useStore((state) => state.clubs);
  const joinRequests = useStore((state) => state.joinRequests);
  const createJoinRequest = useStore((state) => state.createJoinRequest);

  const myClubs = useMemo(() => {
    if (!currentUser?.id) return [];
    return clubs.filter(
      (club) => (club.memberIds || []).includes(currentUser.id) || club.leaderId === currentUser.id
    );
  }, [clubs, currentUser?.id]);
  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const [optimisticInvitesByClub, setOptimisticInvitesByClub] = useState<Record<string, string[]>>({});

  // Potential members — load from backend API (same college only)
  const [potentialMembers, setPotentialMembers] = useState<User[]>([]);
  const [isLoadingPotentialMembers, setIsLoadingPotentialMembers] = useState(false);
  const [hasLoadedPotentialMembers, setHasLoadedPotentialMembers] = useState(false);

  const mapProfileToUser = (p: any): User => ({
    id: p.id,
    name: p.name || 'Student',
    email: p.email || '',
    collegeId: p.college_id || '',
    collegeName: p.college_name || '',
    major: p.major || '',
    year: p.year || 'Freshman',
    semester: p.semester || '',
    profilePhoto: (p.profile_photo || p.profilePhoto || p.avatar_url || p.avatarUrl || '').trim() || undefined,
    interests: toStringArray(p.interests ?? p.interest_tags ?? p.interest_list),
    clubsJoined: toStringArray(p.clubs_joined ?? p.clubsJoined),
    clubsLeading: toStringArray(p.clubs_leading ?? p.clubsLeading),
    eventsAttended: p.events_attended || 0,
    rating: p.rating || 0,
    totalTransactions: p.total_transactions || 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingPotentialMembers(true);
      setHasLoadedPotentialMembers(false);
      if (!isBackendConfigured()) {
        if (!currentUser?.id || !currentUser.collegeId) {
          setPotentialMembers([]);
          setIsLoadingPotentialMembers(false);
          setHasLoadedPotentialMembers(true);
          return;
        }
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email, college_id, college_name, major, year, semester, profile_photo, interests, clubs_joined, clubs_leading, events_attended, rating, total_transactions')
            .eq('college_id', currentUser.collegeId)
            .neq('id', currentUser.id)
            .order('name', { ascending: true });
          if (error) throw error;
          const list = (data || []).map(mapProfileToUser);
          if (!cancelled) setPotentialMembers(list);
          // Resolve private-storage profile photos after cards are already visible.
          void (async () => {
            const resolvedList = await Promise.all(
              list.map(async (member) => {
                try {
                  if (!member.profilePhoto) return member;
                  const resolved = await resolveProfilePhotoUrl(member.profilePhoto);
                  return resolved ? { ...member, profilePhoto: resolved } : member;
                } catch {
                  return member;
                }
              })
            );
            if (!cancelled) setPotentialMembers(resolvedList);
          })();
        } catch (e) {
          console.warn('fetch same-college users (supabase fallback) error', e);
          if (!cancelled) setPotentialMembers([]);
        } finally {
          if (!cancelled) {
            setIsLoadingPotentialMembers(false);
            setHasLoadedPotentialMembers(true);
          }
        }
        return;
      }
      try {
        // Fetch only users from the same college
        const response = await api.get('/users/same-college');
        const data = Array.isArray((response as any)?.data)
          ? (response as any).data
          : Array.isArray((response as any)?.data?.data)
          ? (response as any).data.data
          : [];
        
        if (data && Array.isArray(data)) {
          const list = data.map(mapProfileToUser);
          if (!cancelled) setPotentialMembers(list);
          // Resolve private-storage profile photos after cards are already visible.
          void (async () => {
            const resolvedList = await Promise.all(
              list.map(async (member) => {
                try {
                  if (!member.profilePhoto) return member;
                  const resolved = await resolveProfilePhotoUrl(member.profilePhoto);
                  return resolved ? { ...member, profilePhoto: resolved } : member;
                } catch {
                  return member;
                }
              })
            );
            if (!cancelled) setPotentialMembers(resolvedList);
          })();
          return;
        }
      } catch (e) {
        console.warn('fetch same-college users error', e);
      } finally {
        if (!cancelled) {
          setIsLoadingPotentialMembers(false);
          setHasLoadedPotentialMembers(true);
        }
      }
      // Fallback: keep empty list
      if (!cancelled) setPotentialMembers([]);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.collegeId]);

  const clubTypes: ClubType[] = ['Academic', 'Sports', 'Arts & Culture', 'Technology', 'Social', 'Custom'];

  const availableInterests = useMemo(() => {
    const interestSet = new Set<string>();
    potentialMembers.forEach((member) => {
      (member.interests || []).forEach((interest) => interestSet.add(interest));
    });
    return Array.from(interestSet).slice(0, 8);
  }, [potentialMembers]);

  const activeClub = useMemo(
    () => (activeClubId ? clubs.find((club) => club.id === activeClubId) || null : null),
    [clubs, activeClubId]
  );

  const invitedMemberIds = useMemo(() => {
    if (!activeClubId) return new Set<string>();
    return new Set(
      joinRequests
        .filter(
          (request) =>
            request.clubId === activeClubId &&
            request.initiatedBy === 'leader' &&
            request.status === 'pending'
        )
        .map((request) => request.userId)
    );
  }, [joinRequests, activeClubId]);

  const optimisticInvitedMemberIds = useMemo(() => {
    if (!activeClubId) return new Set<string>();
    return new Set(optimisticInvitesByClub[activeClubId] || []);
  }, [optimisticInvitesByClub, activeClubId]);

  const effectiveInvitedMemberIds = useMemo(
    () => new Set([...Array.from(invitedMemberIds), ...Array.from(optimisticInvitedMemberIds)]),
    [invitedMemberIds, optimisticInvitedMemberIds]
  );

  const filteredMembers = useMemo(() => {
    return potentialMembers.filter((member) => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesInterest = selectedInterest ? (member.interests || []).includes(selectedInterest) : true;
      return matchesSearch && matchesInterest;
    });
  }, [potentialMembers, searchQuery, selectedInterest]);

  useEffect(() => {
    setCurrentProfileIndex(0);
  }, [searchQuery, selectedInterest]);

  useEffect(() => {
    if (!inviteFeedback) return;
    const timeout = setTimeout(() => setInviteFeedback(null), 2500);
    return () => clearTimeout(timeout);
  }, [inviteFeedback]);

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

  const handleInviteMember = (member: User) => {
    if (!currentUser) return;
    if (!activeClub) {
      Alert.alert('Select a club', 'Choose a club first to send invites from the list of your clubs.');
      return;
    }
    if ((activeClub.memberIds || []).includes(member.id)) {
      setInviteFeedback(`${member.name} is already a member`);
      return;
    }
    if (effectiveInvitedMemberIds.has(member.id)) {
      setInviteFeedback(`${member.name} already invited`);
      return;
    }
    setOptimisticInvitesByClub((prev) => {
      if (!activeClub) return prev;
      const existing = prev[activeClub.id] || [];
      if (existing.includes(member.id)) return prev;
      return { ...prev, [activeClub.id]: [...existing, member.id] };
    });
    createJoinRequest({
      id: `invite_${Date.now()}`,
      clubId: activeClub.id,
      userId: member.id,
      userName: member.name,
      initiatedBy: 'leader',
      status: 'pending',
      createdAt: new Date(),
    });
    setInviteFeedback(`Invite sent to ${member.name}`);
  };

  const handleOpenChat = (club: Club) => {
    const clubChat = getClubChat(club.id);
    if (!clubChat) {
      Alert.alert('Chat not ready', 'Please try again once the club chat finishes setting up.');
      return;
    }
    navigation.navigate('ClubChatDetail', { chatId: clubChat.id });
  };

  const createLocalClub = async () => {
    if (!currentUser) return;

    // Try to persist the club directly to Supabase (client-side) when backend is not configured.
    // Falls back to purely local state if the insert fails (e.g., RLS).
    try {
      // 1) Create the club row — RLS requires leader_id to match auth.uid()
      // Only insert columns that exist in the database schema
      const insertClub = {
        name: clubName,
        type: clubType,
        description: clubDescription || null,
        leader_id: currentUser.id,
        leader_name: currentUser.name,
        college_id: currentUser.collegeId || null,
        college_name: currentUser.collegeName || null,
        member_ids: [currentUser.id],
        member_count: 1,
        logo_emoji: '👥',
      } as any;

      const { data: clubRow, error: clubErr } = await supabase
        .from('clubs')
        .insert(insertClub)
        .select('*')
        .single();

      if (clubErr || !clubRow) throw clubErr || new Error('Club insert failed');

      // 2) Create a group chat tied to the club
      let createdChatId: string = '';
      try {
        const { data: chatRow, error: chatErr } = await supabase
          .from('chats')
          .insert({
            type: 'group',
            name: clubRow.name,
            participant_ids: [currentUser.id],
            club_id: clubRow.id,
          })
          .select('*')
          .single();

        if (chatErr) throw chatErr;
        createdChatId = chatRow?.id || '';
      } catch (e) {
        console.warn('Club chat creation failed; continuing without chat id', e);
        createdChatId = `chat_${Date.now()}`;
      }

      // 3) Update the club with the group_chat_id (best-effort)
      try {
        if (createdChatId) {
          await supabase.from('clubs').update({ group_chat_id: createdChatId }).eq('id', clubRow.id);
        }
      } catch (e) {
        console.warn('Failed to update club.group_chat_id', e);
      }

      // 4) Reflect in local state (provide safe defaults for missing schema fields)
      const newClub: Club = {
        id: clubRow.id,
        name: clubRow.name,
        type: clubRow.type,
        description: clubRow.description || '',
        leaderId: clubRow.leader_id || currentUser.id,
        leaderName: clubRow.leader_name || currentUser.name,
        memberIds: Array.isArray(clubRow.member_ids) ? clubRow.member_ids : [currentUser.id],
        memberCount: clubRow.member_count || 1,
        createdAt: clubRow.created_at ? new Date(clubRow.created_at) : new Date(),
        groupChatId: createdChatId,
        logoEmoji: clubRow.logo_emoji || '👥',
        upcomingEvents: clubRow.upcoming_events || 0,
      };

      addClub(newClub);
      addChat({
        id: createdChatId,
        type: 'group',
        name: newClub.name,
        participantIds: [currentUser.id],
        avatarEmoji: '👥',
        lastMessage: {
          id: '1',
          chatId: createdChatId,
          senderId: 'system',
          senderName: 'System',
          text: `${newClub.name} group created!`,
          timestamp: new Date(),
        },
        lastMessageTime: new Date(),
        unreadCount: 0,
        clubId: newClub.id,
      });

      setActiveClubId(newClub.id);
      setShowCreateModal(false);
      setIsSwipeMode(true);
      setCurrentProfileIndex(0);
      resetForm();
      return;
    } catch (persistErr) {
      console.warn('Direct Supabase club creation failed; using in-memory fallback', persistErr);
    }

    // Purely local fallback (last resort)
    const fallbackClub: Club = {
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
      logoEmoji: '👥',
      upcomingEvents: 0,
    };

    addClub(fallbackClub);
    addChat({
      id: fallbackClub.groupChatId,
      type: 'group',
      name: fallbackClub.name,
      participantIds: [currentUser.id],
      avatarEmoji: '👥',
      lastMessage: {
        id: '1',
        chatId: fallbackClub.groupChatId,
        senderId: 'system',
        senderName: 'System',
        text: `${fallbackClub.name} group created!`,
        timestamp: new Date(),
      },
      lastMessageTime: new Date(),
      unreadCount: 0,
      clubId: fallbackClub.id,
    });

    setActiveClubId(fallbackClub.id);
    setShowCreateModal(false);
    setIsSwipeMode(true);
    setCurrentProfileIndex(0);
    resetForm();
  };

  const handleCreateClub = async () => {
    if (!clubName || !clubDescription || !currentUser) return;
    if (createClubInFlightRef.current) return;

    createClubInFlightRef.current = true;
    setIsCreatingClub(true);

    try {
      if (!isBackendConfigured()) {
        await createLocalClub();
        return;
      }

      try {
        let effectiveCollegeId = (currentUser.collegeId || '').trim();
        let effectiveCollegeName = (currentUser.collegeName || '').trim();

        // If we only have collegeId locally, hydrate a display name for better backend fallback.
        if (effectiveCollegeId && !effectiveCollegeName) {
          const { data: collegeById } = await supabase
            .from('colleges')
            .select('id, name')
            .eq('id', effectiveCollegeId)
            .limit(1)
            .maybeSingle();
          if (collegeById?.name) {
            effectiveCollegeName = String((collegeById as any).name).trim();
          }
        }

        // Source of truth fallback: pull latest profile from Supabase.
        if (!effectiveCollegeId || !effectiveCollegeName) {
          const { data: profileRow, error: profileErr } = await supabase
            .from('profiles')
            .select('college_id, college_name')
            .eq('id', currentUser.id)
            .maybeSingle();
          if (!profileErr && profileRow) {
            effectiveCollegeId = ((profileRow as any).college_id || effectiveCollegeId || '').trim();
            effectiveCollegeName = ((profileRow as any).college_name || effectiveCollegeName || '').trim();
          }
        }

        // Last client-side fallback: read auth metadata directly.
        if (!effectiveCollegeId || !effectiveCollegeName) {
          const { data: authUserData } = await supabase.auth.getUser();
          const meta = authUserData?.user?.user_metadata || {};
          if (!effectiveCollegeId && meta.college_id) {
            effectiveCollegeId = String(meta.college_id).trim();
          }
          if (!effectiveCollegeName && meta.college_name) {
            effectiveCollegeName = String(meta.college_name).trim();
          }
        }

        // Heal older/incomplete accounts that have college_name but missing college_id.
        if (!effectiveCollegeId) {
          if (!effectiveCollegeName) {
            Alert.alert(
              'College missing',
              'Your account is missing college info. Please sign out and sign up again selecting your college.'
            );
            return;
          }

          let resolvedCollege: any = null;
          const { data: exactResolvedCollege, error: resolveErr } = await supabase
            .from('colleges')
            .select('id, name')
            .ilike('name', effectiveCollegeName)
            .limit(1)
            .maybeSingle();

          if (!resolveErr && exactResolvedCollege?.id) {
            resolvedCollege = exactResolvedCollege;
          } else {
            const { data: fuzzyResolvedCollege } = await supabase
              .from('colleges')
              .select('id, name')
              .ilike('name', `%${effectiveCollegeName}%`)
              .limit(1)
              .maybeSingle();
            if (fuzzyResolvedCollege?.id) {
              resolvedCollege = fuzzyResolvedCollege;
            }
          }

          if (resolvedCollege?.id) {
            effectiveCollegeId = String((resolvedCollege as any).id);
            effectiveCollegeName = String((resolvedCollege as any).name || effectiveCollegeName).trim();
            try {
              await updateProfile({
                collegeId: effectiveCollegeId,
                collegeName: effectiveCollegeName,
              });
            } catch (profileErr) {
              console.warn('Failed to persist resolved college on profile', profileErr);
            }
          }
        }

        if (!effectiveCollegeId) {
          Alert.alert(
            'College missing',
            'Could not resolve your college. Please sign out and create your account again using the college selector.'
          );
          return;
        }

        const payload = {
          name: clubName,
          type: clubType,
          description: clubDescription,
          college_id: effectiveCollegeId,
          college_name: effectiveCollegeName,
        };
        const created = await api.createClub(payload);
        const createdClub = (created as any).data || created;

        const chatPayload = {
          type: 'group' as const,
          participant_ids: [currentUser.id],
          name: clubName,
          club_id: createdClub.id,
        };
        const chatRes = await api.createChat(chatPayload);
        const createdChat = (chatRes as any).data || chatRes;

        try {
          await api.updateClub(createdClub.id, { group_chat_id: createdChat.id });
        } catch (e) {
          console.warn('Failed to update club with group_chat_id', e);
        }

        const clubToStore: Club = {
          id: createdClub.id,
          name: createdClub.name,
          type: createdClub.type,
          description: createdClub.description,
          leaderId: createdClub.leader_id || currentUser.id,
          leaderName: createdClub.leader_name || currentUser.name,
          memberIds: createdClub.member_ids || [currentUser.id],
          memberCount: createdClub.member_count || 1,
          createdAt: createdClub.created_at ? new Date(createdClub.created_at) : new Date(),
          groupChatId: createdClub.group_chat_id || createdChat.id,
          logoEmoji: createdClub.logo_emoji || '👥',
          upcomingEvents: createdClub.upcoming_events || 0,
        } as Club;

        addClub(clubToStore);

        const chatToStore = {
          id: createdChat.id,
          type: createdChat.type || 'group',
          name: createdChat.name || clubToStore.name,
          participantIds: createdChat.participant_ids || [currentUser.id],
          avatarEmoji: createdChat.avatar_emoji || '👥',
          lastMessage: createdChat.last_message
            ? {
                id: createdChat.last_message.id,
                chatId: createdChat.id,
                senderId: createdChat.last_message.sender_id,
                senderName: createdChat.last_message.sender_name,
                text: createdChat.last_message.text,
                timestamp: createdChat.last_message.timestamp
                  ? new Date(createdChat.last_message.timestamp)
                  : new Date(),
              }
            : {
                id: '1',
                chatId: createdChat.id,
                senderId: 'system',
                senderName: 'System',
                text: `${clubToStore.name} group created!`,
                timestamp: new Date(),
              },
          lastMessageTime: createdChat.last_message_time ? new Date(createdChat.last_message_time) : new Date(),
          unreadCount: createdChat.unread_count || 0,
          clubId: clubToStore.id,
        } as any;

        addChat(chatToStore);

        setActiveClubId(clubToStore.id);
        setShowCreateModal(false);
        setIsSwipeMode(true);
        setCurrentProfileIndex(0);
        resetForm();
      } catch (e) {
        console.warn('Create club backend flow failed', e);
        const message = e instanceof Error ? e.message : String(e || '');
        if (message.includes('Missing college_id')) {
          Alert.alert(
            'College missing',
            'Your account still has no linked college. Please open profile and set your college, then try creating the club again.'
          );
          return;
        }
        Alert.alert('Create club failed', 'Could not create the club right now. Please try again.');
      }
    } finally {
      createClubInFlightRef.current = false;
      setIsCreatingClub(false);
    }
  };

  const resetForm = () => {
    setClubName('');
    setClubDescription('');
    setClubType('Academic');
  };

  const closeSwipeMode = () => {
    setIsSwipeMode(false);
    setActiveClubId(null);
    setShowInterestMenu(false);
    setInviteFeedback(null);
  };

  useEffect(() => {
    const parent = navigation.getParent?.();
    if (!parent) return;

    const unsubscribe = parent.addListener('tabPress', (event: any) => {
      if (!isSwipeMode) return;
      const state = parent.getState?.();
      const pressedRoute = state?.routes?.find((route: any) => route.key === event?.target);
      if (pressedRoute?.name === 'Clubs') {
        closeSwipeMode();
      }
    });

    return unsubscribe;
  }, [navigation, isSwipeMode]);

  const handleSwipeLeft = () => {
    setCurrentProfileIndex((prev) => {
      const next = prev + 1;
      return next > filteredMembers.length ? filteredMembers.length : next;
    });
  };

  const handleSwipeRight = () => {
    const currentProfile = filteredMembers[currentProfileIndex];
    if (currentProfile) {
      handleInviteMember(currentProfile);
    }
    setCurrentProfileIndex((prev) => {
      const next = prev + 1;
      return next > filteredMembers.length ? filteredMembers.length : next;
    });
  };

  if (isSwipeMode) {
    return (
      <View style={styles.swipeContainer}>
        <LinearGradient
          colors={['#E372A1', '#CE678A', '#B06579']}
          style={styles.swipeHeaderGradient}
        >
          <View style={styles.swipeHeader}>
            <TouchableOpacity onPress={closeSwipeMode} style={styles.backButtonContainer}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.swipeTitleWrapper}>
              <Text style={styles.swipeTitle}>Find Members</Text>
              {activeClub && (
                <Text style={styles.swipeSubtitle}>Inviting for {activeClub.name}</Text>
              )}
            </View>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <View style={styles.inviteSearchContainer}>
          <View style={styles.searchRow}>
            <View style={[styles.searchInputWrapper, { flex: 1 }]}>
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
          <View style={styles.inviteContextRow}>
            <Ionicons name="pricetag" size={14} color="#B06579" />
            <Text
              style={[
                styles.inviteContextText,
                !activeClub && styles.inviteContextTextMuted,
              ]}
            >
              {activeClub ? `Inviting members to ${activeClub.name}` : 'Select one of your clubs to send invites'}
            </Text>
          </View>
          {inviteFeedback && (
            <View style={styles.inviteFeedbackChip}>
              <Ionicons name="sparkles" size={14} color="#B06579" />
              <Text style={styles.inviteFeedbackText}>{inviteFeedback}</Text>
            </View>
          )}
          {/* filter temporarily hidden */}
        </View>

        <View style={styles.swipeCardContainer}>
          {isLoadingPotentialMembers && !hasLoadedPotentialMembers ? (
            <View style={styles.loadingSwipeState}>
              <ActivityIndicator size="large" color="#E372A1" />
              <Text style={styles.loadingSwipeTitle}>Loading members...</Text>
              <Text style={styles.loadingSwipeSubtitle}>Fetching students from your college</Text>
            </View>
          ) : filteredMembers.length === 0 ? (
            <View style={styles.emptySwipeState}>
              <Ionicons name="search" size={36} color="#D1D5DB" />
              <Text style={styles.emptySwipeTitle}>No matches</Text>
              <Text style={styles.emptySwipeSubtitle}>Try a different search or filter.</Text>
            </View>
          ) : currentProfileIndex < filteredMembers.length ? (
            <SwipeCard
              user={filteredMembers[currentProfileIndex]}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          ) : (
            <View style={styles.exhaustedState}>
              <Text style={styles.exhaustedSubtitle}>Reload to review members again</Text>
              <TouchableOpacity
                style={styles.smallRefreshButton}
                onPress={() => setCurrentProfileIndex(0)}
              >
                <Ionicons name="refresh" size={14} color="#B06579" />
                <Text style={styles.smallRefreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
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
          isSubmitting={isCreatingClub}
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
                {clubChat?.avatarImage ? (
                  <Image source={{ uri: clubChat.avatarImage }} style={styles.chatAvatarImage} />
                ) : (
                  <Text style={styles.chatAvatarText}>{avatarLabel}</Text>
                )}
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
                    setActiveClubId(club.id);
                    setInviteFeedback(null);
                    setIsSwipeMode(true);
                  }}
                >
                  <Ionicons name="person-add" size={16} color="#E372A1" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

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
        isSubmitting={isCreatingClub}
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
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
}> = ({ visible, onClose, clubName, setClubName, clubType, setClubType, clubDescription, setClubDescription, clubTypes, isSubmitting, onSubmit }) => {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={styles.modalRoot}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Club</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isSubmitting}>
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
              style={[styles.submitButton, (!clubName || !clubDescription || isSubmitting) && styles.submitButtonDisabled]}
              onPress={onSubmit}
              disabled={!clubName || !clubDescription || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Creating...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Create & Invite Members</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
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
  chatAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
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
    paddingTop: 40,
    paddingBottom: 14,
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
  swipeTitleWrapper: {
    alignItems: 'center',
  },
  swipeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  inviteSearchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    flex: 1,
  },
  searchInput: {
    fontSize: 15,
    color: '#111827',
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderColor: '#E372A1',
    backgroundColor: '#FDF2F8',
  },
  inviteContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteContextText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  inviteContextTextMuted: {
    color: '#9CA3AF',
  },
  inviteFeedbackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inviteFeedbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B06579',
  },
  interestOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  interestMenuDrawer: {
    position: 'absolute',
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    maxHeight: 200,
    zIndex: 20,
  },
  interestMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  interestMenuItemActive: {
    backgroundColor: '#FDF2F8',
  },
  interestMenuText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  interestMenuTextActive: {
    color: '#E372A1',
  },
  progressInline: {
    marginTop: 6,
  },
  progressInlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  swipeCardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingSwipeState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  loadingSwipeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  loadingSwipeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptySwipeState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  emptySwipeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySwipeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  exhaustedState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  exhaustedSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  smallRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F4C8D8',
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallRefreshText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B06579',
  },
});
