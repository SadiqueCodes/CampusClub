import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Club, JoinRequest } from '../types';

export const ClubsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { clubs, myClubs, currentUser, addJoinRequest } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClubs(clubs);
    } else {
      const filtered = clubs.filter(
        (club) =>
          club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          club.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          club.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClubs(filtered);
    }
  }, [searchQuery, clubs]);

  const handleJoinClub = (club: Club) => {
    if (!currentUser) return;

    const joinRequest: JoinRequest = {
      id: `request_${Date.now()}`,
      clubId: club.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhoto: currentUser.profilePhoto,
      status: 'pending',
      createdAt: new Date(),
    };

    addJoinRequest(joinRequest);

    Alert.alert(
      'Request Sent!',
      `Your request to join ${club.name} has been sent to ${club.leaderName}. You'll be notified when they respond.`,
      [{ text: 'OK' }]
    );
  };

  const renderClubCard = (club: Club, isMyClub: boolean = false) => (
    <TouchableOpacity
      key={club.id}
      style={styles.clubCard}
      activeOpacity={0.7}
    >
      <View style={styles.clubIcon}>
        <LinearGradient
          colors={['#E372A1', '#CE678A', '#B06579']}
          style={styles.clubIconGradient}
        >
          {club.logo ? (
            <Image source={{ uri: club.logo }} style={styles.clubIconImage} />
          ) : club.logoEmoji ? (
            <Text style={styles.clubIconEmoji}>{club.logoEmoji}</Text>
          ) : (
            <Ionicons name="people" size={28} color="#fff" />
          )}
        </LinearGradient>
      </View>
      <View style={styles.clubInfo}>
        <Text style={styles.clubName}>{club.name}</Text>
        <View style={styles.clubTypeContainer}>
          <Text style={styles.clubType}>{club.type}</Text>
        </View>
        <View style={styles.clubStats}>
          <View style={styles.clubStatItem}>
            <Ionicons name="people-outline" size={14} color="#9CA3AF" />
            <Text style={styles.clubStatText}>{club.memberCount} members</Text>
          </View>
          <View style={styles.clubStatItem}>
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={styles.clubStatText}>{club.upcomingEvents} events</Text>
          </View>
        </View>
      </View>
      {!isMyClub && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => handleJoinClub(club)}
        >
          <Ionicons name="add" size={20} color="#B06579" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  // Filter out clubs the user already belongs to
  const availableClubs = filteredClubs.filter(
    (club) => !club.memberIds.includes(currentUser?.id || '')
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Clubs</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateClub')}
          >
            <Ionicons name="add-circle" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clubs..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Your Clubs Section */}
        {myClubs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Clubs</Text>
              <Text style={styles.sectionCount}>{myClubs.length}</Text>
            </View>
            {myClubs.map((club) => renderClubCard(club, true))}
          </View>
        )}

        {/* All Clubs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'Discover Clubs'}
            </Text>
            <Text style={styles.sectionCount}>{availableClubs.length}</Text>
          </View>

          {availableClubs.length > 0 ? (
            availableClubs.map((club) => renderClubCard(club, false))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No clubs found' : 'No clubs available'}
              </Text>
            </View>
          )}
        </View>

        {/* Create Club CTA */}
        {myClubs.length === 0 && (
          <TouchableOpacity
            style={styles.createClubCTA}
            onPress={() => navigation.navigate('CreateClub')}
          >
            <LinearGradient
              colors={['#E372A1', '#CE678A', '#B06579']}
              style={styles.createClubCTAGradient}
            >
              <Ionicons name="add-circle-outline" size={32} color="#fff" />
              <Text style={styles.createClubCTATitle}>Create Your Own Club</Text>
              <Text style={styles.createClubCTASubtitle}>
                Start building your community today
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  clubIcon: {
    marginRight: 14,
  },
  clubIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubIconImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  clubIconEmoji: {
    fontSize: 28,
    color: '#fff',
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  clubTypeContainer: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  clubType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B06579',
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clubStats: {
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
    fontWeight: '500',
  },
  joinButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  createClubCTA: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createClubCTAGradient: {
    padding: 32,
    alignItems: 'center',
  },
  createClubCTATitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  createClubCTASubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
});
