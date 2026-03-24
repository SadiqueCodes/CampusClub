import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useNavigation } from '@react-navigation/native';

export const ProfileScreen: React.FC = () => {
  const { currentUser, myClubs, logout } = useStore();
  const navigation = useNavigation<any>();
  const yearLabelMap: Record<string, string> = {
    Freshman: 'First Year',
    Sophomore: 'Second Year',
    Junior: 'Third Year',
    Senior: 'Fourth Year',
  };

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#E372A1', '#CE678A', '#B06579']}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Profile</Text>
              <Text style={styles.headerSubtitle}>Session still loading</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.emptyProfileState}>
          <Ionicons name="person-circle-outline" size={54} color="#D1D5DB" />
          <Text style={styles.emptyProfileText}>Could not load your profile yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>{currentUser.collegeName}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('ProfileSettings')}
          >
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              {currentUser.profilePhoto ? (
                <Image source={{ uri: currentUser.profilePhoto }} style={styles.profilePhotoImage} />
              ) : (
                <Text style={styles.profileInitial}>{currentUser.name.charAt(0)}</Text>
              )}
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.name}>{currentUser.name}</Text>
              <Text style={styles.metaText}>
                {currentUser.major} • {yearLabelMap[currentUser.year] || currentUser.year} • Sem {currentUser.semester}
              </Text>
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={16} color="#B06579" />
                <Text style={styles.detailText}>{currentUser.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={16} color="#B06579" />
                <Text style={styles.detailText}>{currentUser.collegeId}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.snapshotRow}>
          <View style={styles.snapshotChip}>
            <Text style={styles.snapshotLabel}>Clubs</Text>
            <Text style={styles.snapshotValue}>{myClubs.length}</Text>
          </View>
          <View style={styles.snapshotChip}>
            <Text style={styles.snapshotLabel}>Events</Text>
            <Text style={styles.snapshotValue}>{currentUser.eventsAttended}</Text>
          </View>
          <View style={styles.snapshotChip}>
            <Text style={styles.snapshotLabel}>Listings</Text>
            <Text style={styles.snapshotValue}>{currentUser.totalTransactions}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionTitle}>My Clubs</Text>
            <Text style={styles.sectionSubtitle}>{myClubs.length} total</Text>
          </View>
          {myClubs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={36} color="#D1D5DB" />
              <Text style={styles.emptyText}>You haven't joined any clubs yet</Text>
            </View>
          ) : (
            myClubs.map((club) => (
              <View key={club.id} style={styles.clubRow}>
                <View>
                  <Text style={styles.clubName}>{club.name}</Text>
                  <Text style={styles.clubType}>{club.type}</Text>
                </View>
                {club.leaderId === currentUser.id && (
                  <View style={styles.leaderBadge}>
                    <Ionicons name="star" size={14} color="#fff" />
                    <Text style={styles.leaderBadgeText}>Lead</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionTitle}>Listings</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>View all</Text>
            </TouchableOpacity>
          </View>
          {['Camera', 'Laptop', 'Textbook'].map((item, index) => (
            <View key={item} style={styles.listingRow}>
              <View style={styles.listingChip}>
                <Ionicons
                  name={index === 0 ? 'camera-outline' : index === 1 ? 'laptop-outline' : 'book-outline'}
                  size={18}
                  color="#B06579"
                />
              </View>
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle}>{item}</Text>
                <Text style={styles.listingPrice}>{index === 0 ? '$120' : index === 1 ? '$450' : '$30'}</Text>
              </View>
              <View style={[styles.listingStatusBadge, index === 2 && styles.soldBadge]}>
                <Text style={[styles.listingStatusText, index === 2 && styles.soldText]}>
                  {index === 2 ? 'Sold' : 'Active'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <TouchableOpacity style={styles.logoutRow} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#E372A1" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal:2,
    marginTop: 12,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: '800',
    color: '#B06579',
  },
  profileDetails: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
    gap: 24,
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 12,
  },
  snapshotChip: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 4,
  },
  snapshotLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  snapshotValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#B06579',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  listingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  listingStatusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  listingStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  soldBadge: {
    backgroundColor: '#F3F4F6',
  },
  soldText: {
    color: '#6B7280',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  sectionAction: {
    fontSize: 13,
    color: '#B06579',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '500',
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  clubType: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E372A1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  leaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listingChip: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E372A1',
  },
  emptyProfileState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyProfileText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});
