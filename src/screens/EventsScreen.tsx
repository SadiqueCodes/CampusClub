import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useNavigation, useRoute } from '@react-navigation/native';

type EventsViewMode = 'my' | 'all';

export const EventsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { events, currentUser } = useStore();
  const allEvents = useMemo(
    () => [...events].filter((event) => !event.isClosed).sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events]
  );
  const myEvents = useMemo(
    () => allEvents.filter((event) => !!currentUser?.id && event.createdBy === currentUser.id),
    [allEvents, currentUser?.id]
  );
  const publicEvents = useMemo(
    () => allEvents.filter((event) => !currentUser?.id || event.createdBy !== currentUser.id),
    [allEvents, currentUser?.id]
  );

  const [viewMode, setViewMode] = useState<EventsViewMode>('my');

  useEffect(() => {
    const initialView = route.params?.initialView as EventsViewMode | undefined;
    if (initialView === 'all' || initialView === 'my') {
      setViewMode(initialView);
    } else {
      setViewMode('my');
    }
  }, [route.params?.initialView]);

  const visibleEvents = viewMode === 'my' ? myEvents : publicEvents;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E372A1', '#CE678A', '#B06579']} style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
      </LinearGradient>

      <View style={styles.switchWrap}>
        <View style={styles.switchTrack}>
          <TouchableOpacity
            style={[styles.switchBtn, viewMode === 'my' && styles.switchBtnActive]}
            onPress={() => setViewMode('my')}
          >
            <Text style={[styles.switchText, viewMode === 'my' && styles.switchTextActive]}>My Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchBtn, viewMode === 'all' && styles.switchBtnActive]}
            onPress={() => setViewMode('all')}
          >
            <Text style={[styles.switchText, viewMode === 'all' && styles.switchTextActive]}>Other Events</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {visibleEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {viewMode === 'my' ? 'No events created by you yet' : 'No events yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {viewMode === 'my'
                ? 'Create an event to manage it here'
                : 'Events will appear here once created'}
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {visibleEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() =>
                  viewMode === 'my'
                    ? navigation.navigate('ManageEvent', { event })
                    : navigation.navigate('EventDetail', { event })
                }
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
                    <Text style={styles.statText}>{event.interestedCount} interested</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons
                      name={viewMode === 'my' ? 'settings-outline' : 'location'}
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.statText}>
                      {viewMode === 'my' ? 'Tap to manage' : event.location}
                    </Text>
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
  switchWrap: {
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
  },
  switchTrack: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
  },
  switchBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchBtnActive: {
    backgroundColor: '#FFF5F8',
  },
  switchText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  switchTextActive: {
    color: '#B06579',
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
    textAlign: 'center',
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
