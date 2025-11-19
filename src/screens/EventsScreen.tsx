import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useNavigation } from '@react-navigation/native';

export const EventsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { events, currentUser } = useStore();

  // Filter events created by current user
  const myEvents = events.filter((event) => event.createdBy === currentUser?.id);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
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
                    <Ionicons name="heart" size={16} color="#E372A1" />
                    <Text style={styles.statText}>
                      {event.interestedCount} interested
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="location" size={16} color="#6B7280" />
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
    color: '#2D3436',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  eventsList: {
    padding: 20,
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#E372A1',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  eventClub: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  eventDateBadge: {
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  eventDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B06579',
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
    color: '#6B7280',
    fontWeight: '500',
  },
});
