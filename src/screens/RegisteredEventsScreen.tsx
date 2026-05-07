import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

export const RegisteredEventsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentUser, events } = useStore();

  const registeredEvents = useMemo(() => {
    const myId = currentUser?.id || '';
    return [...events]
      .filter((event) => !event.isClosed && (event.registeredUserIds || []).includes(myId))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, currentUser?.id]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E372A1', '#CE678A', '#B06579']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registered Events</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {registeredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={46} color="#D1D5DB" />
            <Text style={styles.emptyText}>No registered events yet</Text>
          </View>
        ) : (
          registeredEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('Events', { screen: 'EventDetail', params: { event } })}
            >
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventMeta}>{event.clubName}</Text>
              <Text style={styles.eventMeta}>
                {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {event.time}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  content: { flex: 1 },
  contentInner: { padding: 20, gap: 10, paddingBottom: 80 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#E372A1',
  },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  eventMeta: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
});
