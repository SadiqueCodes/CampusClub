import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

export const ProfileScreen: React.FC = () => {
  const { currentUser, myClubs, logout } = useStore();

  if (!currentUser) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.profilePhotoContainer}>
            <LinearGradient
              colors={['#fff', '#F8F9FA']}
              style={styles.profilePhoto}
            >
              <Text style={styles.profileInitial}>{currentUser.name.charAt(0)}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.infoText}>{currentUser.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.infoText}>{currentUser.major} • {currentUser.year}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.infoText}>{currentUser.collegeId}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#B06579" />
            <Text style={styles.statValue}>{myClubs.length}</Text>
            <Text style={styles.statLabel}>Clubs</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#B06579" />
            <Text style={styles.statValue}>{currentUser.eventsAttended}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="pricetag" size={24} color="#B06579" />
            <Text style={styles.statValue}>{currentUser.totalTransactions}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
        </View>

        {/* My Clubs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>My Clubs</Text>
          </View>
          {myClubs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>You haven't joined any clubs yet</Text>
            </View>
          ) : (
            myClubs.map((club) => (
              <View key={club.id} style={styles.clubCard}>
                <View style={styles.clubIconContainer}>
                  <LinearGradient
                    colors={['#E372A1', '#CE678A', '#B06579']}
                    style={styles.clubIcon}
                  >
                    <Ionicons name="people" size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{club.name}</Text>
                  <Text style={styles.clubType}>{club.type}</Text>
                </View>
                {club.leaderId === currentUser.id && (
                  <View style={styles.leaderBadge}>
                    <Text style={styles.leaderBadgeText}>Leader</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* My Listings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag" size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>My Listings</Text>
          </View>
          <View style={styles.listingCard}>
            <View style={styles.listingIconContainer}>
              <Ionicons name="camera-outline" size={24} color="#B06579" />
            </View>
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>Camera</Text>
              <Text style={styles.listingPrice}>$120</Text>
            </View>
            <View style={styles.listingStatusBadge}>
              <Text style={styles.listingStatusText}>Active</Text>
            </View>
          </View>
          <View style={styles.listingCard}>
            <View style={styles.listingIconContainer}>
              <Ionicons name="laptop-outline" size={24} color="#B06579" />
            </View>
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>Laptop</Text>
              <Text style={styles.listingPrice}>$450</Text>
            </View>
            <View style={styles.listingStatusBadge}>
              <Text style={styles.listingStatusText}>Active</Text>
            </View>
          </View>
          <View style={styles.listingCard}>
            <View style={styles.listingIconContainer}>
              <Ionicons name="book-outline" size={24} color="#B06579" />
            </View>
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>Textbook</Text>
              <Text style={styles.listingPrice}>$30</Text>
            </View>
            <View style={[styles.listingStatusBadge, styles.soldBadge]}>
              <Text style={[styles.listingStatusText, styles.soldText]}>Sold</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LinearGradient
            colors={['#E372A1', '#CE678A', '#B06579']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </LinearGradient>
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
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 24,
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profilePhotoContainer: {
    marginBottom: 16,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  profileInitial: {
    fontSize: 42,
    fontWeight: '800',
    color: '#B06579',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    fontWeight: '500',
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  clubIconContainer: {
    marginRight: 12,
  },
  clubIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  leaderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B06579',
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
});
