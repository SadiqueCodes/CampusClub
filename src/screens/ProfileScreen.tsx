import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Button } from '../components';
import { theme } from '../theme';
import { useStore } from '../store';

export const ProfileScreen: React.FC = () => {
  const { currentUser, myClubs, logout } = useStore();

  if (!currentUser) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Profile</Text>
        <TouchableOpacity>
          <Text style={styles.editButton}>⚙️ Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profilePhoto}>
            <Text style={styles.profileInitial}>{currentUser.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.email}>📧 {currentUser.email}</Text>
          <Text style={styles.info}>
            🎓 {currentUser.major} • {currentUser.year}
          </Text>
          <Text style={styles.info}>🆔 {currentUser.collegeId}</Text>
        </View>

        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>📊 STATS</Text>
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
          <Text style={styles.cardTitle}>🎯 MY CLUBS</Text>
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
          <Text style={styles.cardTitle}>🛒 MY LISTINGS</Text>
          <View style={styles.listingItem}>
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>📷 Camera - $120</Text>
              <Text style={styles.listingStatus}>Active</Text>
            </View>
          </View>
          <View style={styles.listingItem}>
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>💻 Laptop - $450</Text>
              <Text style={styles.listingStatus}>Active</Text>
            </View>
          </View>
          <View style={styles.listingItem}>
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>📚 Textbook - $30</Text>
              <Text style={[styles.listingStatus, styles.soldStatus]}>Sold</Text>
            </View>
          </View>
        </Card>

        <Button
          title="🚪 Logout"
          onPress={logout}
          variant="outline"
          textColor={theme.colors.white}
          style={styles.logoutButton}
        />
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
  editButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white,
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
  email: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white + 'DD',
    marginBottom: theme.spacing.xs,
  },
  info: {
    fontSize: theme.fontSize.md,
    color: theme.colors.white + 'DD',
    marginBottom: theme.spacing.xs,
  },
  statsCard: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
    marginBottom: theme.spacing.md,
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
    color: theme.colors.blue.indigo,
    fontWeight: theme.fontWeight.bold,
  },
  listingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
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
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
});
