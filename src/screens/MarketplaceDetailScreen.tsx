import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Linking, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

export const MarketplaceDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { itemId } = route.params;
  const { marketplaceItems, currentUser, closeMarketplaceItem, marketplaceFlags, flagMarketplaceItem } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [closeConfirmVisible, setCloseConfirmVisible] = useState(false);
  const [reportPopup, setReportPopup] = useState<{ visible: boolean; title: string; message: string; shouldGoBack: boolean }>({
    visible: false,
    title: '',
    message: '',
    shouldGoBack: false,
  });

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
  const flagCount = (marketplaceFlags[item.id] || []).length;
  const hasFlagged = !!(currentUser?.id && (marketplaceFlags[item.id] || []).includes(currentUser.id));

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
    setCloseConfirmVisible(true);
  };

  const handleConfirmClose = async () => {
    try {
      setIsSubmitting(true);
      await closeMarketplaceItem(item.id);
      setCloseConfirmVisible(false);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not close listing right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlagItem = async () => {
    if (!currentUser?.id) return;
    if (isOwnListing) return;
    if (hasFlagged) return;
    let nextCount = 0;
    try {
      nextCount = await flagMarketplaceItem(item.id, currentUser.id);
    } catch (e: any) {
      Alert.alert('Report failed', e?.message || 'Could not save report right now.');
      return;
    }
    if (nextCount >= 3) {
      setReportPopup({
        visible: true,
        title: 'Item Removed',
        message: 'This item was removed after multiple scam reports.',
        shouldGoBack: true,
      });
    } else {
      setReportPopup({
        visible: true,
        title: 'Report Submitted',
        message: `Thanks. Reports: ${nextCount}/3`,
        shouldGoBack: false,
      });
    }
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

      {!isOwnListing && (
        <TouchableOpacity
          style={[styles.flagButton, hasFlagged && styles.flagButtonDisabled]}
          onPress={handleFlagItem}
          disabled={hasFlagged}
        >
          <Ionicons name="flag-outline" size={16} color={hasFlagged ? '#9CA3AF' : '#DC2626'} />
          <Text style={[styles.flagButtonText, hasFlagged && styles.flagButtonTextDisabled]}>
            {hasFlagged ? `Reported (${flagCount}/3)` : `Report scam (${flagCount}/3)`}
          </Text>
        </TouchableOpacity>
      )}

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
      <Modal
        transparent
        visible={reportPopup.visible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setReportPopup((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupIconWrap}>
              <Ionicons name="flag" size={20} color="#fff" />
            </View>
            <Text style={styles.popupTitle}>{reportPopup.title}</Text>
            <Text style={styles.popupMessage}>{reportPopup.message}</Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => {
                const shouldGoBack = reportPopup.shouldGoBack;
                setReportPopup((prev) => ({ ...prev, visible: false }));
                if (shouldGoBack) navigation.goBack();
              }}
            >
              <Text style={styles.popupButtonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={closeConfirmVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => !isSubmitting && setCloseConfirmVisible(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupIconWrap}>
              <Ionicons name="lock-closed" size={20} color="#fff" />
            </View>
            <Text style={styles.popupTitle}>Close Listing?</Text>
            <Text style={styles.popupMessage}>
              This will mark your listing as closed and hide contact actions for buyers.
            </Text>
            <View style={styles.popupActionsRow}>
              <TouchableOpacity
                style={[styles.popupButtonSecondary, isSubmitting && styles.actionDisabled]}
                onPress={() => setCloseConfirmVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.popupButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.popupButton, isSubmitting && styles.actionDisabled]}
                onPress={handleConfirmClose}
                disabled={isSubmitting}
              >
                <Text style={styles.popupButtonText}>{isSubmitting ? 'Closing...' : 'Close'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 48,
    backgroundColor: '#F8F9FA',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0D3DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#E372A1',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
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
  flagButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  flagButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  flagButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  flagButtonTextDisabled: {
    color: '#9CA3AF',
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
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  popupCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5D8E2',
    shadowColor: '#E372A1',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 7,
  },
  popupIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E372A1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  popupMessage: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  popupButton: {
    minWidth: 120,
    borderRadius: 12,
    backgroundColor: '#E372A1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  popupActionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  popupButtonSecondary: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5D8E2',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupButtonSecondaryText: {
    color: '#B06579',
    fontSize: 14,
    fontWeight: '700',
  },
});
