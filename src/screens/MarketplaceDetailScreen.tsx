import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

export const MarketplaceDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { itemId } = route.params;
  const { marketplaceItems, currentUser } = useStore();

  const item = marketplaceItems.find((i) => i.id === itemId);

  if (!item) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Listing not found.</Text>
      </View>
    );
  }

  const isOwnListing = currentUser?.id === item.sellerId;

  const handleBuy = () => {
    Alert.alert('Purchase request sent', `Contact ${item.sellerName} to finalize the deal.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color="#111827" />
      </TouchableOpacity>
      <View style={styles.mediaCard}>
        {item.images?.length ? (
          <Image source={{ uri: item.images[0] }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#B06579" />
            <Text style={styles.placeholderText}>No photo provided</Text>
          </View>
        )}
        <Text style={styles.statusPill}>{item.status?.toUpperCase() || 'ACTIVE'}</Text>
      </View>

      <View style={styles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.metaText}>Posted {item.createdAt?.toLocaleDateString() || 'recently'}</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>{item.price}</Text>
        </View>
      </View>

      <View style={styles.infoChips}>
        <View style={styles.infoChip}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.infoChipText}>Quality Verified</Text>
        </View>
        <View style={styles.infoChip}>
          <Ionicons name="flash" size={16} color="#F59E0B" />
          <Text style={styles.infoChipText}>Instant Pickup</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About this item</Text>
        <Text style={styles.description}>{item.description || 'No description provided.'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Seller</Text>
        <View style={styles.sellerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{item.sellerName?.charAt(0) ?? '?'}</Text>
          </View>
          <View>
            <Text style={styles.sellerName}>{item.sellerName}</Text>
            <Text style={styles.sellerMeta}>
              {item.sellerMajor || 'Student'} • {item.sellerYear || 'Year'}
            </Text>
          </View>
        </View>
      </View>

      {!isOwnListing ? (
        <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
          <Text style={styles.buyButtonText}>Contact Seller</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.ownerBadge}>
          <Ionicons name="pricetag" size={16} color="#fff" />
          <Text style={styles.ownerBadgeText}>This is your listing</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mediaCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    marginBottom: 20,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 280,
  },
  imagePlaceholder: {
    width: '100%',
    height: 280,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    color: '#B06579',
    fontWeight: '600',
  },
  statusPill: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  metaText: {
    color: '#9CA3AF',
  },
  priceTag: {
    backgroundColor: '#FFF1F3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 12,
    color: '#B06579',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#B06579',
  },
  infoChips: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  description: {
    color: '#4B5563',
    lineHeight: 20,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF1F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#B06579',
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sellerMeta: {
    color: '#6B7280',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B06579',
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 6,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  ownerBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ownerBadgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
  },
});
