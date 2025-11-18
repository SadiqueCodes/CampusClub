import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { theme } from '../theme';

export const ProfileScreen: React.FC = () => {
  const { currentUser, myClubs, logout } = useStore();

  if (!currentUser) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.colors.gradients.profile}
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
              colors={[theme.colors.primary[800], theme.colors.primary[500]]}
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
            <Ionicons name="people" size={24} color={theme.colors.accent.neon} />
            <Text style={styles.statValue}>{myClubs.length}</Text>
            <Text style={styles.statLabel}>Clubs</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={theme.colors.accent.neon} />
            <Text style={styles.statValue}>{currentUser.eventsAttended}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="pricetag" size={24} color={theme.colors.accent.neon} />
            <Text style={styles.statValue}>{currentUser.totalTransactions}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
        </View>

        {/* My Clubs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color={theme.colors.text.primary} />
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
                    colors={[theme.colors.primary[600], theme.colors.secondary[400]]}
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
            <Ionicons name="pricetag" size={20} color={theme.colors.text.primary} />
            <Text style={styles.sectionTitle}>My Listings</Text>
          </View>
          <View style={styles.listingCard}>
            <View style={styles.listingIconContainer}>
              <Ionicons name="camera-outline" size={24} color={theme.colors.accent.neon} />
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
              <Ionicons name="laptop-outline" size={24} color={theme.colors.accent.neon} />
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
              <Ionicons name="book-outline" size={24} color={theme.colors.accent.neon} />
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
            colors={[theme.colors.primary[500], theme.colors.accent.magenta]}
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
    backgroundColor: theme.colors.background.profile,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 12,
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
    color: theme.colors.white,
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
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  profileInitial: {
    fontSize: 42,
    fontWeight: '800',
    color: theme.colors.white,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.white,
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
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 5,
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
    color: theme.colors.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.muted,
    marginTop: 12,
    fontWeight: '500',
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
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
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  clubType: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  leaderBadge: {
    backgroundColor: 'rgba(91,99,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  leaderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary[200],
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  listingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 13,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  listingStatusBadge: {
    backgroundColor: 'rgba(14,229,154,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  listingStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0CE39A',
  },
  soldBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  soldText: {
    color: theme.colors.text.muted,
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
    color: theme.colors.white,
  },
});
