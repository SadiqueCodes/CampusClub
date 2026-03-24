import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Club } from '../types';

export const SearchClubsScreen: React.FC = () => {
  const clubs = useStore((state) => state.clubs);
  const currentUser = useStore((state) => state.currentUser);
  const joinRequests = useStore((state) => state.joinRequests);
  const createJoinRequest = useStore((state) => state.createJoinRequest);
  const [query, setQuery] = useState('');

  const myId = currentUser?.id || '';
  const availableClubs = useMemo(() => clubs, [clubs]);

  const filteredClubs = useMemo(() => {
    if (!query.trim()) return availableClubs;
    const lowered = query.trim().toLowerCase();
    return availableClubs.filter(
      (club) =>
        club.name.toLowerCase().includes(lowered) ||
        club.description.toLowerCase().includes(lowered) ||
        club.type.toLowerCase().includes(lowered)
    );
  }, [availableClubs, query]);

  const requestedClubIds = useMemo(
    () =>
      joinRequests
        .filter(
          (request) =>
            request.userId === myId &&
            request.status === 'pending' &&
            request.initiatedBy === 'user'
        )
        .map((request) => request.clubId),
    [joinRequests, myId]
  );

  const handleRequestJoin = async (club: Club) => {
    if (!currentUser) return;
    if (requestedClubIds.includes(club.id)) return;
    if ((club.memberIds || []).includes(myId)) {
      Alert.alert('Already joined', 'You are already a member of this club.');
      return;
    }

    await createJoinRequest({
      id: `request_${Date.now()}`,
      clubId: club.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhoto: currentUser.profilePhoto,
      initiatedBy: 'user',
      status: 'pending',
      createdAt: new Date(),
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Discover Clubs</Text>
        <Text style={styles.headerSubtitle}>Search your campus community</Text>
      </LinearGradient>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by club, interest, or type"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.resultsList} showsVerticalScrollIndicator={false}>
        {filteredClubs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={32} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No clubs found</Text>
            <Text style={styles.emptySubtitle}>Try another keyword or create a new club.</Text>
          </View>
        ) : (
          filteredClubs.map((club) => {
            const isRequested = requestedClubIds.includes(club.id);
            const isMember = (club.memberIds || []).includes(myId);
            const buttonLabel = isMember ? 'Already joined' : isRequested ? 'Request Sent' : 'Request to Join';
            const buttonDisabled = isRequested;
            return (
              <View key={club.id} style={styles.clubCard}>
                <View style={styles.clubHeaderRow}>
                  <Text style={styles.clubName}>{club.name}</Text>
                  <View style={styles.clubTypePill}>
                    <Text style={styles.clubTypeText}>{club.type}</Text>
                  </View>
                </View>
                <Text style={styles.clubDescription} numberOfLines={2}>
                  {club.description}
                </Text>
                <View style={styles.clubStatsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="people" size={16} color="#B06579" />
                    <Text style={styles.statText}>{club.memberCount} members</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar" size={16} color="#B06579" />
                    <Text style={styles.statText}>{club.upcomingEvents} events</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.joinButton,
                    (buttonDisabled || isMember) && styles.joinButtonDisabled,
                  ]}
                  onPress={() => handleRequestJoin(club)}
                  disabled={buttonDisabled}
                >
                  <Text style={styles.joinButtonText}>{buttonLabel}</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
    marginBottom: 16,
    fontWeight: '500',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: -24,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
  },
  resultsList: {
    padding: 20,
    paddingBottom: 120,
  },
  clubCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  clubHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  clubTypePill: {
    backgroundColor: '#FFF1F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  clubTypeText: {
    fontSize: 12,
    color: '#B06579',
    fontWeight: '700',
  },
  clubDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  clubStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#B06579',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});
