import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Line, Defs, Pattern, Rect } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { Lobster_400Regular } from '@expo-google-fonts/lobster';
import { Card } from '../components';
import { theme } from '../theme';
import { useStore } from '../store';
import { Club, Event, MarketplaceItem } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { clubs, events, marketplaceItems, currentUser } = useStore();

  const [fontsLoaded] = useFonts({
    Lobster_400Regular,
  });

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
        return ['#C86B8A', '#D98CA8'];
      case 'Technology':
        return ['#5A6BC8', '#7A8CD8'];
      case 'Sports':
        return ['#5A8F7B', '#7BAD96'];
      case 'Academic':
        return ['#D97B52', '#E89B7A'];
      case 'Social':
        return ['#C86B8A', '#D98CA8'];
      default:
        return ['#7DD3FC', '#C67E8E'];
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

  const renderClubCard = ({ item }: { item: Club }) => {
    const [gradientStart, gradientEnd] = getClubGradient(item.type);

    return (
      <TouchableOpacity style={styles.clubCard}>
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          style={styles.clubCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Pattern Overlay */}
          <Svg width={280} height={160} style={styles.patternOverlay}>
            <Defs>
              <Pattern id={`dots-${item.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <Circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.15)" />
              </Pattern>
            </Defs>
            <Rect width="280" height="160" fill={`url(#dots-${item.id})`} />
            <Circle cx="240" cy="30" r="60" fill="rgba(255,255,255,0.08)" />
            <Circle cx="30" cy="130" r="40" fill="rgba(255,255,255,0.08)" />
          </Svg>

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
  };

  const isClubLeader = currentUser && clubs.some(c => c.leaderId === currentUser.id);

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={theme.colors.gradients.home}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>CampusClub</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Clubs Section */}
        <View style={styles.section}>
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
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddEvent')}
              >
                <Ionicons name="add" size={18} color="#fff" />
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
            <View style={styles.eventsContainer}>
              {events.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.eventCard}
                  onPress={() => navigation.navigate('EventDetail', { event: item })}
                >
                  <View style={styles.eventDateBadge}>
                    <Text style={styles.eventDateDay}>{item.date.getDate()}</Text>
                    <Text style={styles.eventDateMonth}>
                      {item.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.eventDetailsContainer}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{item.title}</Text>
                    </View>

                    <View style={styles.eventMetaContainer}>
                      <View style={styles.eventMetaItem}>
                        <Ionicons name="time" size={14} color="#94A3B8" />
                        <Text style={styles.eventMetaText}>{item.time}</Text>
                      </View>
                      <View style={styles.eventMetaDivider} />
                      <View style={styles.eventMetaItem}>
                        <Ionicons name="location" size={14} color="#94A3B8" />
                        <Text style={styles.eventMetaText} numberOfLines={1}>{item.location}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Marketplace Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Marketplace</Text>
            <TouchableOpacity>
              <Text style={styles.seeMoreText}>See More</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.marketplaceGrid}>
            {marketplaceItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.marketplaceItem}>
                {item.images && item.images.length > 0 ? (
                  <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Ionicons
                      name={
                        item.title.includes('Camera')
                          ? 'camera'
                          : item.title.includes('Book')
                          ? 'book'
                          : 'headset'
                      }
                      size={28}
                      color="#7DD3FC"
                    />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemPrice}>${item.price}</Text>
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {item.sellerName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add Item Card */}
            <TouchableOpacity style={styles.addItemCard}>
              <View style={styles.addItemIconContainer}>
                <Ionicons name="add" size={32} color="#7DD3FC" />
              </View>
            </TouchableOpacity>
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
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Lobster_400Regular',
    color: theme.colors.white,
    letterSpacing: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 24,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B63FF',
  },
  eventsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38BDF8',
  },
  clubsList: {
    paddingHorizontal: 20,
  },
  clubCard: {
    width: 280,
    marginRight: 16,
  },
  clubCardGradient: {
    borderRadius: 20,
    padding: 16,
    height: 180,
    justifyContent: 'space-between',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
    overflow: 'hidden',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  clubCardInner: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
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
    backgroundColor: 'rgba(7,11,22,0.4)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
  emptyClubs: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyClubsText: {
    fontSize: 14,
    color: '#717DA6',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent.neon,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent.neon,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  emptyState: {
    backgroundColor: theme.colors.card,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  eventsContainer: {
    paddingHorizontal: 0,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eventDateBadge: {
    width: 55,
    height: 55,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  eventDateDay: {
    fontSize: 22,
    fontWeight: '800',
    color: '#7DD3FC',
    lineHeight: 26,
  },
  eventDateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5B63FF',
    letterSpacing: 0.5,
  },
  eventDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 8,
  },
  eventClubBadge: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  eventClubName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7DD3FC',
  },
  eventMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#1C2436',
  },
  eventMetaText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  marketplaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  addItemCard: {
    width: '48%',
    backgroundColor: '#0F1628',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    borderWidth: 2,
    borderColor: '#1C2436',
    borderStyle: 'dashed',
  },
  addItemIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1C2436',
    borderStyle: 'dashed',
  },
  marketplaceItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#0F1628',
  },
  itemImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#0F1628',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  itemInfo: {
    gap: 4,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5B63FF',
  },
  sellerName: {
    fontSize: 11,
    color: '#717DA6',
    fontWeight: '500',
  },
});
