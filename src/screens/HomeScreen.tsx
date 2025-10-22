import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components';
import { theme } from '../theme';
import { useStore } from '../store';
import { Club, Event, MarketplaceItem } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const getClubIcon = (type: string) => {
    switch (type) {
      case 'Arts & Culture':
        return 'color-palette';
      case 'Technology':
        return 'code-slash';
      case 'Sports':
        return 'football';
      case 'Academic':
        return 'book';
      case 'Social':
        return 'people';
      default:
        return 'star';
    }
  };

  const getClubGradient = (type: string): [string, string] => {
    switch (type) {
      case 'Arts & Culture':
        return ['#FF9B9B', '#FFB4B4'];
      case 'Technology':
        return ['#6366F1', '#8B5CF6'];
      case 'Sports':
        return ['#10B981', '#34D399'];
      case 'Academic':
        return ['#F59E0B', '#FBBF24'];
      case 'Social':
        return ['#EC4899', '#F472B6'];
      default:
        return ['#6366F1', '#8B5CF6'];
    }
  };

  // Get popular clubs: clubs with >5 members OR clubs with upcoming events
  const getPopularClubs = () => {
    const popularClubs = clubs.filter(club => club.memberCount > 5 || club.upcomingEvents > 0);

    // Sort by popularity (member count + events)
    const sorted = popularClubs.sort((a, b) => {
      const scoreA = a.memberCount + (a.upcomingEvents * 10);
      const scoreB = b.memberCount + (b.upcomingEvents * 10);
      return scoreB - scoreA;
    });

    // Return top 5 or all if less than 5
    return sorted.slice(0, 5);
  };

  const popularClubs = getPopularClubs();

  const renderClubCard = ({ item }: { item: Club }) => (
    <TouchableOpacity style={styles.clubCard}>
      <LinearGradient
        colors={getClubGradient(item.type)}
        style={styles.clubCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.clubCardInner}>
          <View style={styles.clubCardContent}>
            <View style={styles.clubCardHeader}>
              <View style={styles.clubLogoContainer}>
                {item.logo ? (
                  <Image source={{ uri: item.logo }} style={styles.clubLogo} />
                ) : (
                  <Ionicons name={getClubIcon(item.type) as any} size={20} color="#fff" />
                )}
              </View>
              <View style={styles.clubCardBadge}>
                <Ionicons name="people" size={10} color="#fff" />
                <Text style={styles.clubCardBadgeText}>{item.memberCount}</Text>
              </View>
            </View>
            <Text style={styles.clubCardName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.clubCardType} numberOfLines={1}>{item.type}</Text>
          </View>
          <TouchableOpacity style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const isClubLeader = currentUser && clubs.some(c => c.leaderId === currentUser.id);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {currentUser?.name || 'Student'}</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={20} color="#2D3436" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Clubs Section */}
        <View style={styles.section}>
        <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Popular Clubs</Text>
     </View>
          {popularClubs.length > 0 ? (
            <FlatList
              horizontal
              data={popularClubs}
              renderItem={renderClubCard}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clubsList}
            />
          ) : (
            <View style={styles.emptyClubs}>
              <Text style={styles.emptyClubsText}>No popular clubs yet</Text>
            </View>
          )}
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <View style={styles.eventsHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {isClubLeader && (
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {events.length === 0 && isClubLeader ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No events yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first event!</Text>
            </View>
          ) : (
            events.map((event) => (
              <TouchableOpacity key={event.id} style={styles.eventCard}>
                <View style={styles.eventIconContainer}>
                  <LinearGradient
                    colors={['#FF9B9B', '#FFB4B4']}
                    style={styles.eventIconGradient}
                  >
                    <Ionicons name="calendar" size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.eventDetailText}>{event.location}</Text>
                  </View>
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.eventDetailText}>
                      {event.date.toLocaleDateString()} at {event.time}
                    </Text>
                  </View>
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="people-outline" size={14} color="#6B7280" />
                    <Text style={styles.eventDetailText}>{event.clubName}</Text>
                  </View>
                </View>
                <View style={styles.interestedBadge}>
                  <Ionicons name="heart" size={12} color="#FF9B9B" />
                  <Text style={styles.interestedCount}>{event.interestedCount}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Marketplace Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Marketplace</Text>
          </View>
          <View style={styles.marketplaceGrid}>
            {marketplaceItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.marketplaceItem}>
                <View style={styles.itemImagePlaceholder}>
                  <Ionicons
                    name={
                      item.title.includes('Camera')
                        ? 'camera'
                        : item.title.includes('Book')
                        ? 'book'
                        : 'headset'
                    }
                    size={32}
                    color="#9CA3AF"
                  />
                </View>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
                <View style={styles.sellerRow}>
                  <Ionicons name="person-circle-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {item.sellerName}
                  </Text>
                </View>
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9B9B',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  eventsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9B9B',
  },
  clubsList: {
    paddingHorizontal: 20,
  },
  clubCard: {
    width: 280,
    marginRight: 16,
  },
  clubCardGradient: {
    borderRadius: 16,
    padding: 16,
    height: 160,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  clubCardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  clubCardContent: {
    flex: 0,
  },
  clubCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clubLogoContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clubLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  clubCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  clubCardBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  clubCardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 22,
  },
  clubCardType: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3436',
  },
  emptyClubs: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyClubsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF9B9B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9B9B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventIconContainer: {
    marginRight: 12,
  },
  eventIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  eventDetailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  interestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    height: 24,
    gap: 4,
  },
  interestedCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9B9B',
    marginLeft: 4,
  },
  marketplaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  marketplaceItem: {
    width: (SCREEN_WIDTH - 64) / 3,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9B9B',
    marginBottom: 4,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
    marginLeft: 4,
  },
});
