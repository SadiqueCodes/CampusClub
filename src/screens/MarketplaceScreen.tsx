import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { MarketplaceItem } from '../types';

export const MarketplaceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { marketplaceItems, currentUser } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const formatPrice = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

  const filtered = useMemo(() => {
    const base =
      filter === 'mine'
        ? marketplaceItems.filter((item) => item.sellerId === currentUser?.id && item.status === 'active')
        : marketplaceItems.filter((item) => item.status === 'active');

    if (!query.trim()) return base;
    const term = query.trim().toLowerCase();
    return base.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.sellerName.toLowerCase().includes(term)
    );
  }, [marketplaceItems, query, filter, currentUser?.id]);

  const renderItem = ({ item }: { item: MarketplaceItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('MarketplaceDetail', { itemId: item.id })}
    >
      {item.images?.length ? (
        <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Ionicons name="image-outline" size={24} color="#B06579" />
        </View>
      )}
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
      <Text style={styles.cardSeller} numberOfLines={1}>
        {item.sellerName}
      </Text>
      {filter === 'mine' && (
        <Text style={styles.cardStatus}>{(item.status || 'active').toUpperCase()}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <Text style={styles.headerSubtitle}>Browse campus deals</Text>
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items or sellers"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'mine' && styles.filterChipActive]}
          onPress={() => setFilter('mine')}
        >
          <Text style={[styles.filterChipText, filter === 'mine' && styles.filterChipTextActive]}>Posted By Me</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    color: '#6B7280',
    marginTop: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: '#E372A1',
    borderColor: '#E372A1',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  cardPrice: {
    color: '#E372A1',
    fontWeight: '700',
    marginTop: 4,
  },
  cardSeller: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardStatus: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#B06579',
  },
});
