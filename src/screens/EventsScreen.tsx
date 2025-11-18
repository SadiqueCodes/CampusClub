import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

export const EventsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { events, currentUser } = useStore();

  // Filter events created by current user
  const myEvents = events.filter((event) => event.createdBy === currentUser?.id);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.colors.gradients.create}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Events</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {myEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No events created yet</Text>
            <Text style={styles.emptySubtext}>
              Create events from the home screen
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {myEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => navigation.navigate('ManageEvent', { event })}
              >
                <View style={styles.eventHeader}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventClub}>{event.clubName}</Text>
                  </View>
                  <View style={styles.eventDateBadge}>
                    <Text style={styles.eventDate}>
                      {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={16} color={theme.colors.accent.magenta} />
                    <Text style={styles.statText}>
                      {event.interestedCount} interested
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="location" size={16} color={theme.colors.text.muted} />
                    <Text style={styles.statText}>{event.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.create,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  eventsList: {
    padding: 20,
    gap: 12,
  },
  eventCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  eventClub: {
    fontSize: 13,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  eventDateBadge: {
    backgroundColor: 'rgba(91,99,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  eventDate: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.accent.primary,
  },
  eventStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
});
