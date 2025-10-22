import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../components';
import { theme } from '../theme';
import { useStore } from '../store';

export const ProfileScreen: React.FC = () => {
  const { currentUser, myClubs, logout } = useStore();

  if (!currentUser) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButtonContainer}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profilePhoto}>
            <Text style={styles.profileInitial}>{currentUser.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color="#fff" />
            <Text style={styles.infoText}>{currentUser.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={16} color="#fff" />
            <Text style={styles.infoText}>{currentUser.major} • {currentUser.year}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={16} color="#fff" />
            <Text style={styles.infoText}>{currentUser.collegeId}</Text>
          </View>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="stats-chart" size={18} color="#2D3436" />
            <Text style={styles.cardTitle}>STATS</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{myClubs.length}</Text>
              <Text style={styles.statLabel}>Clubs Joined</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.eventsAttended}</Text>
              <Text style={styles.statLabel}>Events Attended</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.totalTransactions}</Text>
              <Text style={styles.statLabel}>Items Listed</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="people" size={18} color="#2D3436" />
            <Text style={styles.cardTitle}>MY CLUBS</Text>
          </View>
          {myClubs.length === 0 ? (
            <Text style={styles.emptyText}>You haven't joined any clubs yet</Text>
          ) : (
            myClubs.map((club) => (
              <View key={club.id} style={styles.clubItem}>
                <Text style={styles.clubItemText}>
                  • {club.name}
                  {club.leaderId === currentUser.id && (
                    <Text style={styles.leaderBadge}> (Leader)</Text>
                  )}
                </Text>
              </View>
            ))
          )}
        </Card>

        <Card style={styles.section}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="pricetag" size={18} color="#2D3436" />
            <Text style={styles.cardTitle}>MY LISTINGS</Text>
          </View>
          <View style={styles.listingItem}>
            <Ionicons name="camera-outline" size={18} color="#636E72" style={styles.listingIcon} />
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>Camera - $120</Text>
              <Text style={styles.listingStatus}>Active</Text>
            </View>
          </View>
          <View style={styles.listingItem}>
            <Ionicons name="laptop-outline" size={18} color="#636E72" style={styles.listingIcon} />
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>Laptop - $450</Text>
              <Text style={styles.listingStatus}>Active</Text>
            </View>
          </View>
          <View style={styles.listingItem}>
            <Ionicons name="book-outline" size={18} color="#636E72" style={styles.listingIcon} />
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>Textbook - $30</Text>
              <Text style={[styles.listingStatus, styles.soldStatus]}>Sold</Text>
            </View>
          </View>
        </Card>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  editButtonContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.profile,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },
  profileInitial: {
    fontSize: 48,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  name: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white + 'DD',
  },
  statsCard: {
    marginBottom: theme.spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent.profile,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.darkGrey,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.darkGrey,
    fontStyle: 'italic',
  },
  clubItem: {
    marginBottom: theme.spacing.sm,
  },
  clubItemText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.dark,
  },
  leaderBadge: {
    color: '#FF9B9B',
    fontWeight: theme.fontWeight.bold,
  },
  listingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  listingIcon: {
    marginRight: 12,
  },
  listingInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.dark,
  },
  listingStatus: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.semibold,
  },
  soldStatus: {
    color: theme.colors.text.darkGrey,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  logoutButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
  },
});
