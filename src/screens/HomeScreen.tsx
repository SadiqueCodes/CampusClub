import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components';
import { theme } from '../theme';
import { useStore } from '../store';
import { Club, Event, MarketplaceItem } from '../types';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { clubs, events, marketplaceItems, currentUser } = useStore();

  // Mock data initialization
  useEffect(() => {
    if (clubs.length === 0) {
      useStore.getState().setClubs([
        {
          id: '1',
          name: 'Art Club',
          type: 'Arts & Culture',
          description: 'For art lovers',
          leaderId: '2',
          leaderName: 'Sarah',
          memberIds: [],
          memberCount: 128,
          createdAt: new Date(),
          groupChatId: 'chat1',
          upcomingEvents: 2,
        },
        {
          id: '2',
          name: 'Code Club',
          type: 'Technology',
          description: 'For developers',
          leaderId: '3',
          leaderName: 'Mike',
          memberIds: [],
          memberCount: 94,
          createdAt: new Date(),
          groupChatId: 'chat2',
          upcomingEvents: 1,
        },
        {
          id: '3',
          name: 'Sport Club',
          type: 'Sports',
          description: 'For athletes',
          leaderId: '4',
          leaderName: 'John',
          memberIds: [],
          memberCount: 210,
          createdAt: new Date(),
          groupChatId: 'chat3',
          upcomingEvents: 3,
        },
      ]);
    }

    if (events.length === 0) {
      useStore.getState().setEvents([
        {
          id: '1',
          title: 'Tech Fest 2024',
          description: 'Annual technology festival',
          clubId: '2',
          clubName: 'Tech Club',
          date: new Date('2024-03-15'),
          time: '3:00 PM',
          location: 'Main Auditorium',
          interestedUserIds: [],
          interestedCount: 52,
          createdBy: '3',
        },
        {
          id: '2',
          title: 'Art Exhibition',
          description: 'Student art showcase',
          clubId: '1',
          clubName: 'Art Club',
          date: new Date('2024-03-18'),
          time: '10:00 AM',
          location: 'Gallery Hall',
          interestedUserIds: [],
          interestedCount: 38,
          createdBy: '2',
        },
      ]);
    }

    if (marketplaceItems.length === 0) {
      useStore.getState().setMarketplaceItems([
        {
          id: '1',
          title: 'Camera',
          description: 'Canon DSLR',
          price: 120,
          images: [],
          sellerId: '2',
          sellerName: 'Sarah',
          sellerMajor: 'CS',
          sellerYear: 'Junior',
          sellerRating: 4.8,
          status: 'active',
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Books',
          description: 'Textbooks',
          price: 25,
          images: [],
          sellerId: '3',
          sellerName: 'Mike',
          sellerMajor: 'Math',
          sellerYear: 'Senior',
          sellerRating: 4.5,
          status: 'active',
          createdAt: new Date(),
        },
        {
          id: '3',
          title: 'Headphones',
          description: 'Sony WH-1000XM4',
          price: 80,
          images: [],
          sellerId: '4',
          sellerName: 'Emma',
          sellerMajor: 'Music',
          sellerYear: 'Sophomore',
          sellerRating: 5.0,
          status: 'active',
          createdAt: new Date(),
        },
      ]);
    }
  }, []);

  const renderClubCard = ({ item }: { item: Club }) => (
    <TouchableOpacity style={styles.clubCard}>
      <View style={styles.clubIcon}>
        <Text style={styles.clubEmoji}>
          {item.type === 'Arts & Culture' ? '🎨' : item.type === 'Technology' ? '💻' : '⚽'}
        </Text>
      </View>
      <Text style={styles.clubName}>{item.name}</Text>
      <Text style={styles.clubMembers}>👥 {item.memberCount}</Text>
    </TouchableOpacity>
  );

  const isClubLeader = currentUser && clubs.some(c => c.leaderId === currentUser.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏠 CampusClub</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Clubs Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Clubs</Text>
          <FlatList
            horizontal
            data={clubs}
            renderItem={renderClubCard}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clubsList}
          />
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Upcoming Events</Text>
            {isClubLeader && (
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            )}
          </View>

          {events.length === 0 && isClubLeader && (
            <Card style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No events yet. Create your first event!</Text>
            </Card>
          )}

          {events.map((event) => (
            <Card key={event.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDetail}>📍 {event.location}</Text>
              <Text style={styles.eventDetail}>
                🕒 {event.date.toLocaleDateString()} at {event.time}
              </Text>
              <Text style={styles.eventDetail}>👥 Hosted by: {event.clubName}</Text>
            </Card>
          ))}
        </View>

        {/* Marketplace Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Marketplace</Text>
          <View style={styles.marketplaceGrid}>
            {marketplaceItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.marketplaceItem}>
                <View style={styles.itemImagePlaceholder}>
                  <Text style={styles.itemEmoji}>
                    {item.title.includes('Camera') ? '📷' : item.title.includes('Book') ? '📚' : '🎧'}
                  </Text>
                </View>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.home,
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
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  clubsList: {
    paddingHorizontal: theme.spacing.lg,
  },
  clubCard: {
    width: 120,
    marginRight: theme.spacing.md,
    alignItems: 'center',
  },
  clubIcon: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  clubEmoji: {
    fontSize: 40,
  },
  clubName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  clubMembers: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.white + 'CC',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.home,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: theme.colors.text.dark,
    fontWeight: theme.fontWeight.bold,
  },
  emptyState: {
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.darkGrey,
    textAlign: 'center',
  },
  eventCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  eventTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
    marginBottom: theme.spacing.sm,
  },
  eventDetail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.darkGrey,
    marginBottom: theme.spacing.xs,
  },
  marketplaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
  },
  marketplaceItem: {
    width: '30%',
    marginRight: '3.33%',
    marginBottom: theme.spacing.md,
  },
  itemImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  itemEmoji: {
    fontSize: 32,
  },
  itemTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  itemPrice: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent.home,
  },
});
