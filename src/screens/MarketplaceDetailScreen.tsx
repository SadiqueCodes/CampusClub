import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

export const MarketplaceDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { itemId } = route.params;
  const { marketplaceItems, currentUser, closeMarketplaceItem } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const item = marketplaceItems.find((i) => i.id === itemId);
  const formatPrice = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

  if (!item) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Listing not found.</Text>
      </View>
    );
  }

  const isOwnListing = currentUser?.id === item.sellerId;

  const handleBuy = () => {
    if (item.status !== 'active') {
      Alert.alert('Listing closed', 'This listing is no longer active.');
      return;
    }
    const phone = (item.sellerPhone || '').trim();
    if (!phone) {
      Alert.alert('Phone unavailable', 'Seller phone number is not available for this listing.');
      return;
    }
    const dialPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    Linking.openURL(`tel:${dialPhone}`).catch(() => {
      Alert.alert('Dial failed', 'Could not open phone dialer right now.');
    });
  };

  const handleMarkClosed = () => {
    if (item.status === 'sold') {
      Alert.alert('Already closed', 'This listing is already marked as closed.');
      return;
    }
    Alert.alert('Close listing', 'Mark this listing as closed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsSubmitting(true);
            await closeMarketplaceItem(item.id);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Failed', e?.message || 'Could not close listing right now.');
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
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
          <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
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
              {item.sellerMajor || 'Student'} | {item.sellerYear || 'Year'}
            </Text>
          </View>
        </View>
      </View>

      {!isOwnListing ? (
        item.status === 'active' ? (
          <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.buyButtonText}>Contact Seller</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.ownerBadge}>
            <Ionicons name="lock-closed" size={16} color="#fff" />
            <Text style={styles.ownerBadgeText}>Listing Closed</Text>
          </View>
        )
      ) : (
        <View style={styles.ownerActions}>
          <TouchableOpacity
            style={[styles.closeButton, (item.status === 'sold' || isSubmitting) && styles.actionDisabled]}
            disabled={item.status === 'sold' || isSubmitting}
            onPress={handleMarkClosed}
          >
            <Text style={styles.closeButtonText}>{item.status === 'sold' ? 'Closed' : 'Mark Closed'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
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
    marginTop: 2,
  },
  buyButton: {
    marginTop: 8,
    backgroundColor: '#E372A1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  ownerBadge: {
    marginTop: 8,
    backgroundColor: '#6B7280',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ownerBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  ownerActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E372A1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  actionDisabled: {
    opacity: 0.55,
  },
});
