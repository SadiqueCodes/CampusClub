import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Dimensions, Modal, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Line, Defs, Pattern, Rect } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { Lobster_400Regular } from '@expo-google-fonts/lobster';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store';
import { Club, Event, MarketplaceItem } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { clubs, events, marketplaceItems, currentUser, joinRequests } = useStore();
  const createMarketplaceItem = useStore((state) => state.createMarketplaceItem);
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingTitle, setListingTitle] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [isListingSaving, setIsListingSaving] = useState(false);
  const [listingImage, setListingImage] = useState<string | null>(null);
  const fetchInitialData = useStore((s) => s.fetchInitialData);
  const [fontsLoaded] = useFonts({
    Lobster_400Regular,
  });
  const myId = currentUser?.id || '';

  const myRequests = useMemo(
    () => joinRequests.filter((request) => request.userId === myId),
    [joinRequests, myId]
  );

  const pendingRequestClubIds = useMemo(() => {
    return new Set(
      joinRequests
        .filter(
          (request) => request.userId === myId && request.status === 'pending' && request.initiatedBy === 'user'
        )
        .map((request) => request.clubId)
    );
  }, [joinRequests, myId]);

  const pendingMyRequests = useMemo(
    () =>
      myRequests.filter(
        (request) => request.status === 'pending' && request.initiatedBy === 'user'
      ),
    [myRequests]
  );

  const incomingRequests = useMemo(() => {
    if (!myId) return [];
    return joinRequests.filter((request) => {
      if (request.initiatedBy !== 'user') return false;
      const club = clubs.find((c) => c.id === request.clubId);
      return club && club.leaderId === myId;
    });
  }, [joinRequests, clubs, myId]);

  const pendingIncomingRequests = useMemo(
    () => incomingRequests.filter((request) => request.status === 'pending'),
    [incomingRequests]
  );

  const invitationsForMe = useMemo(
    () =>
      joinRequests.filter(
        (request) =>
          request.initiatedBy === 'leader' &&
          request.userId === myId &&
          request.status === 'pending'
      ),
    [joinRequests, myId]
  );

  const notificationCount =
    pendingIncomingRequests.length + pendingMyRequests.length + invitationsForMe.length;

  // Fetch live data from Supabase (or backend) — re-run when currentUser changes
  useEffect(() => {
    let mounted = true;
    const fn = async () => {
      try {
        await fetchInitialData();
      } catch (err) {
        if (mounted) console.error('Error fetching initial data', err);
      }
    };
    fn();
    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

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

  const heroCardGradients: Array<[string, string]> = [
    ['#E372A1', '#CE678A'],
    ['#5A6BC8', '#7A8CD8'],
    ['#5A8F7B', '#7BAD96'],
    ['#D97B52', '#E89B7A'],
    ['#8E54E9', '#4776E6'],
  ];

  const hashString = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const getClubGradient = (club: Club): [string, string] => {
    const paletteIndex = hashString(`${club.id || ''}-${club.name || ''}`) % heroCardGradients.length;
    return heroCardGradients[paletteIndex];
  };

  const getMyClubs = () => {
    if (!currentUser?.id) return [];
    return clubs.filter((club) => club.memberIds.includes(currentUser.id));
  };

  const getClubRecommendations = () => {
    if (clubs.length <= 3) {
      return clubs;
    }
    return [...clubs].sort((a, b) => {
      const scoreA = a.memberCount + a.upcomingEvents * 10;
      const scoreB = b.memberCount + b.upcomingEvents * 10;
      return scoreB - scoreA;
    });
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

  const myClubList = getMyClubs();

  const heroClubs = () => {
    if (clubs.length === 0) {
      return [];
    }

    if (clubs.length <= 3) {
      return clubs;
    }
    const personal = myClubList.slice(0, 3);
    if (personal.length === 3) return personal;

    const ranking = getClubRecommendations().filter(
      (club) => !personal.find((personalClub) => personalClub.id === club.id)
    );

    return [...personal, ...ranking.slice(0, 3 - personal.length)];
  };

  const popularClubs = heroClubs();

  const renderClubCard = ({ item }: { item: Club }) => {
    const [gradientStart, gradientEnd] = getClubGradient(item);
    const isMember = currentUser ? item.memberIds.includes(currentUser.id) : false;
    const isPending = pendingRequestClubIds.has(item.id);
    let ctaLabel = 'Apply';
    if (isMember) {
      ctaLabel = 'Joined';
    } else if (isPending) {
      ctaLabel = 'Applied';
    }

    return (
      <TouchableOpacity style={styles.clubCard} activeOpacity={0.98}>
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
                  ) : item.logoEmoji ? (
                    <Text style={styles.clubLogoEmoji}>{item.logoEmoji}</Text>
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
            <TouchableOpacity style={[styles.applyButton, (isMember || isPending) && styles.applyButtonDisabled]} disabled>
              <Text style={[styles.applyButtonText, (isMember || isPending) && styles.applyButtonTextMuted]}>
                {ctaLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const isClubLeader = currentUser && clubs.some(c => c.leaderId === currentUser.id);

  const handleCreateListing = async () => {
    if (!currentUser) {
      Alert.alert('Sign in required', 'Please sign in to list an item.');
      return;
    }
    if (!listingTitle.trim()) {
      Alert.alert('Missing info', 'Please enter a title for your listing.');
      return;
    }
    const parsedPrice = Number(listingPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid price', 'Enter a valid positive price.');
      return;
    }
    setIsListingSaving(true);
    try {
      await createMarketplaceItem({
        title: listingTitle.trim(),
        description: listingDescription.trim() || 'No description provided',
        price: parsedPrice,
        imageUris: listingImage ? [listingImage] : [],
      });
      closeListingModal();
    } catch (err) {
      console.error('create listing error', err);
      Alert.alert('Could not create listing', 'Please try again.');
    } finally {
      setIsListingSaving(false);
    }
  };

  const closeListingModal = () => {
    setShowListingModal(false);
    setListingTitle('');
    setListingDescription('');
    setListingPrice('');
    setListingImage(null);
  };

  const handlePickListingImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setListingImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>CampusClub</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
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
                        <Ionicons name="time" size={14} color="#6B7280" />
                        <Text style={styles.eventMetaText}>{item.time}</Text>
                      </View>
                      <View style={styles.eventMetaDivider} />
                      <View style={styles.eventMetaItem}>
                        <Ionicons name="location" size={14} color="#6B7280" />
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
            <TouchableOpacity onPress={() => navigation.navigate('Marketplace')}>
              <Text style={styles.seeMoreText}>See More</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.marketplaceGrid}>
            {marketplaceItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.marketplaceItem}
                onPress={() => navigation.navigate('MarketplaceDetail', { itemId: item.id })}
              >
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
                      color="#B06579"
                    />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                <Text style={styles.itemPrice}>{item.price}</Text>
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {item.sellerName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add Item Card */}
            <TouchableOpacity style={styles.addItemCard} onPress={() => setShowListingModal(true)}>
              <View style={styles.addItemIconContainer}>
                <Ionicons name="add" size={32} color="#B06579" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showListingModal}
        animationType="slide"
        transparent
        onRequestClose={closeListingModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>List an Item</Text>
              <TouchableOpacity onPress={closeListingModal}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Item title"
              value={listingTitle}
              onChangeText={setListingTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Description"
              value={listingDescription}
              onChangeText={setListingDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {listingImage ? (
              <TouchableOpacity onPress={() => setListingImage(null)} style={styles.imagePreviewWrapper}>
                <Image source={{ uri: listingImage }} style={styles.imagePreview} />
                <Text style={styles.removeImageText}>Tap to remove image</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.modalImageButton} onPress={handlePickListingImage}>
                <Ionicons name="image-outline" size={20} color="#B06579" />
                <Text style={styles.modalImageButtonText}>Add photo</Text>
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="Price"
              value={listingPrice}
              onChangeText={setListingPrice}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.modalButton, isListingSaving && { opacity: 0.7 }]}
              onPress={handleCreateListing}
              disabled={isListingSaving}
            >
              <Text style={styles.modalButtonText}>
                {isListingSaving ? 'Saving...' : 'Create Listing'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
    color: '#fff',
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
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 16,
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
  seeMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E372A1',
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
    color: '#1F2937',
    letterSpacing: 0.5,
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
  clubLogoEmoji: {
    fontSize: 20,
    color: '#fff',
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
  applyButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3436',
  },
  applyButtonTextMuted: {
    color: '#6B7280',
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E372A1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E372A1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
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
  eventsContainer: {
    paddingHorizontal: 20,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#E372A1',
  },
  eventDateBadge: {
    width: 55,
    height: 55,
    backgroundColor: '#FFF5F8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  eventDateDay: {
    fontSize: 22,
    fontWeight: '800',
    color: '#B06579',
    lineHeight: 26,
  },
  eventDateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E372A1',
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
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  eventClubBadge: {
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  eventClubName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B06579',
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
    backgroundColor: '#E5E7EB',
  },
  eventMetaText: {
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: '#F3F4F6',
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
    borderColor: '#E5E7EB',
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
    borderColor: '#E5E7EB',
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
    borderColor: '#F3F4F6',
  },
  itemImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F3F4F6',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFF5F8',
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
    color: '#1F2937',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E372A1',
  },
  sellerName: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#111827',
  },
  modalTextarea: {
    height: 100,
  },
  modalImageButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalImageButtonText: {
    color: '#B06579',
    fontWeight: '600',
  },
  imagePreviewWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 160,
  },
  removeImageText: {
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 12,
    color: '#B06579',
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#B06579',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
