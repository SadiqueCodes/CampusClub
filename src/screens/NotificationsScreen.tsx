import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { JoinRequest } from '../types';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { joinRequests, clubs, currentUser, updateJoinRequest, updateClub, chats, updateChat } =
    useStore();
  const myId = currentUser?.id || '';

  const myApplications = useMemo(
    () => joinRequests.filter((request) => request.userId === myId && request.initiatedBy === 'user'),
    [joinRequests, myId]
  );

  const incomingRequests = useMemo(() => {
    if (!myId) return [];
    return joinRequests.filter((request) => {
      if (request.initiatedBy !== 'user') return false;
      const club = clubs.find((c) => c.id === request.clubId);
      return club && club.leaderId === myId;
    });
  }, [joinRequests, clubs, myId]);

  const sentInvites = useMemo(() => {
    if (!myId) return [];
    return joinRequests.filter((request) => {
      if (request.initiatedBy !== 'leader') return false;
      const club = clubs.find((c) => c.id === request.clubId);
      return club && club.leaderId === myId;
    });
  }, [joinRequests, clubs, myId]);

  const receivedInvitations = useMemo(
    () =>
      joinRequests.filter(
        (request) => request.initiatedBy === 'leader' && request.userId === myId
      ),
    [joinRequests, myId]
  );

  const requestStatusMeta: Record<
    JoinRequest['status'],
    { label: string; background: string; color: string }
  > = {
    pending: { label: 'Pending', background: '#FEF3C7', color: '#92400E' },
    accepted: { label: 'Accepted', background: '#DCFCE7', color: '#065F46' },
    rejected: { label: 'Declined', background: '#FEE2E2', color: '#991B1B' },
    cancelled: { label: 'Cancelled', background: '#E5E7EB', color: '#374151' },
  };

  const formatRequestDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const addUserToClub = (clubId: string, userId: string) => {
    const club = clubs.find((c) => c.id === clubId);
    if (!club) return;

    if (!club.memberIds.includes(userId)) {
      updateClub(club.id, {
        memberIds: [...club.memberIds, userId],
        memberCount: club.memberIds.length + 1,
      });
    }

    const clubChat = chats.find((chat) => chat.clubId === clubId);
    if (clubChat && !clubChat.participantIds.includes(userId)) {
      updateChat(clubChat.id, { participantIds: [...clubChat.participantIds, userId] });
    }
  };

  const handleApplicationDecision = (request: JoinRequest, decision: 'accepted' | 'rejected') => {
    if (decision === 'accepted') {
      addUserToClub(request.clubId, request.userId);
    }
    updateJoinRequest(request.id, { status: decision, respondedAt: new Date() });
  };

  const handleInvitationDecision = (request: JoinRequest, decision: 'accepted' | 'rejected') => {
    if (decision === 'accepted' && request.userId === myId) {
      addUserToClub(request.clubId, request.userId);
    }
    updateJoinRequest(request.id, { status: decision, respondedAt: new Date() });
  };

  const handleCancelRequest = (request: JoinRequest) => {
    updateJoinRequest(request.id, { status: 'cancelled', respondedAt: new Date() });
  };

  const handleCancelInvite = (request: JoinRequest) => {
    updateJoinRequest(request.id, { status: 'cancelled', respondedAt: new Date() });
  };

  const renderStatusBadge = (request: JoinRequest) => {
    const statusMeta = requestStatusMeta[request.status];
    return (
      <View style={[styles.statusBadge, { backgroundColor: statusMeta.background }]}>
        <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
          {statusMeta.label}
        </Text>
      </View>
    );
  };

  const renderEmptyState = (text: string) => (
    <Text style={styles.emptySectionText}>{text}</Text>
  );

  const pendingInvitesForMe = receivedInvitations.filter((request) => request.status === 'pending');
  const pendingApplications = myApplications.filter((request) => request.status === 'pending');
  const pendingIncoming = incomingRequests.filter((request) => request.status === 'pending');
  const pendingSentInvites = sentInvites.filter((request) => request.status === 'pending');

  const summaryTiles = [
    {
      key: 'invitationsForMe',
      title: 'Invites for you',
      count: pendingInvitesForMe.length,
      icon: 'mail-unread',
      colors: ['#F9637C', '#F78DA7'],
    },
    {
      key: 'myApplications',
      title: 'My applications',
      count: pendingApplications.length,
      icon: 'paper-plane',
      colors: ['#8E54E9', '#4776E6'],
    },
    {
      key: 'incoming',
      title: 'Incoming requests',
      count: pendingIncoming.length,
      icon: 'people-circle',
      colors: ['#0BA360', '#3CBA92'],
    },
    {
      key: 'sent',
      title: 'Invites you sent',
      count: pendingSentInvites.length,
      icon: 'send',
      colors: ['#F7971E', '#FFD200'],
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E372A1', '#CE678A', '#B06579']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Activity Center</Text>
            <Text style={styles.headerSubtitle}>Manage every club invite and request</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
          {summaryTiles.map((tile, index) => (
            <LinearGradient
              key={tile.key}
              colors={tile.colors as any}
              style={[
                styles.summaryTile,
                { marginRight: index === summaryTiles.length - 1 ? 0 : 12 },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryTileHeader}>
                <Ionicons name={tile.icon as any} size={18} color="#fff" />
                <Text style={styles.summaryTileLabel}>{tile.title}</Text>
              </View>
              <Text style={styles.summaryTileCount}>{tile.count}</Text>
              <Text style={styles.summaryTileHint}>
                {tile.count === 1 ? 'item pending' : 'items pending'}
              </Text>
            </LinearGradient>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="gift-outline" size={16} color="#B06579" />
            </View>
            <Text style={styles.sectionTitle}>Invitations for you</Text>
          </View>
          {receivedInvitations.length === 0 ? (
            renderEmptyState('No invites yet. Club leads can invite you to join.')
          ) : (
            receivedInvitations.map((request) => {
              const club = clubs.find((c) => c.id === request.clubId);
              return (
                <View key={request.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.clubAvatar}>
                      <Text style={styles.clubAvatarText}>{club?.name?.charAt(0).toUpperCase() || 'C'}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{club?.name || 'Club unavailable'}</Text>
                      <Text style={styles.cardSubtitle}>
                        Invited {formatRequestDate(request.createdAt)}
                        {request.respondedAt ? ` • Updated ${formatRequestDate(request.respondedAt)}` : ''}
                      </Text>
                    </View>
                    {renderStatusBadge(request)}
                  </View>
                  {request.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.declineButton}
                        onPress={() => handleInvitationDecision(request, 'rejected')}
                      >
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleInvitationDecision(request, 'accepted')}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="paper-plane-outline" size={16} color="#4C1D95" />
            </View>
            <Text style={styles.sectionTitle}>My applications</Text>
          </View>
          {myApplications.length === 0 ? (
            renderEmptyState("You haven't requested to join any clubs yet.")
          ) : (
            myApplications.map((request) => {
              const club = clubs.find((c) => c.id === request.clubId);
              return (
                <View key={request.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.clubAvatar}>
                      <Text style={styles.clubAvatarText}>{club?.name?.charAt(0).toUpperCase() || 'C'}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{club?.name || 'Club unavailable'}</Text>
                      <Text style={styles.cardSubtitle}>
                        Applied {formatRequestDate(request.createdAt)}
                        {request.respondedAt ? ` • Updated ${formatRequestDate(request.respondedAt)}` : ''}
                      </Text>
                    </View>
                    {renderStatusBadge(request)}
                  </View>
                  {request.status === 'pending' && (
                    <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelRequest(request)}>
                      <Text style={styles.cancelButtonText}>Cancel request</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#047857" />
            </View>
            <Text style={styles.sectionTitle}>Incoming requests (your clubs)</Text>
          </View>
          {incomingRequests.length === 0 ? (
            renderEmptyState('No new join requests yet. Members will appear here.')
          ) : (
            incomingRequests.map((request) => {
              const club = clubs.find((c) => c.id === request.clubId);
              const initial = request.userName?.charAt(0).toUpperCase() || '?';
              return (
                <View key={request.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.userAvatar}>
                      {request.userPhoto ? (
                        <Image source={{ uri: request.userPhoto }} style={styles.userImage} />
                      ) : (
                        <Text style={styles.userAvatarText}>{initial}</Text>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{request.userName}</Text>
                      <Text style={styles.cardSubtitle}>wants to join {club?.name || 'your club'}</Text>
                    </View>
                    {renderStatusBadge(request)}
                  </View>
                  {request.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.declineButton} onPress={() => handleApplicationDecision(request, 'rejected')}>
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.acceptButton} onPress={() => handleApplicationDecision(request, 'accepted')}>
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="sparkles-outline" size={16} color="#C2410C" />
            </View>
            <Text style={styles.sectionTitle}>Invites you sent</Text>
          </View>
          {pendingSentInvites.length === 0 ? (
            renderEmptyState('Invite members from Find Members to see them here.')
          ) : (
            pendingSentInvites.map((request) => {
              const club = clubs.find((c) => c.id === request.clubId);
              const initial = request.userName?.charAt(0).toUpperCase() || '?';
              return (
                <View key={request.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{initial}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{request.userName}</Text>
                      <Text style={styles.cardSubtitle}>
                        Invited to {club?.name || 'your club'} on {formatRequestDate(request.createdAt)}
                      </Text>
                    </View>
                    {renderStatusBadge(request)}
                  </View>
                  {request.status === 'pending' && (
                    <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelInvite(request)}>
                      <Text style={styles.cancelButtonText}>Cancel invite</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 28,
  },
  summaryScroll: {
    paddingVertical: 12,
    paddingRight: 16,
    paddingLeft: 4,
  },
  summaryTile: {
    width: 190,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTileLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryTileCount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 12,
  },
  summaryTileHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B06579',
  },
  userImage: {
    width: 48,
    height: 48,
  },
  clubAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#312E81',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  declineButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  cancelButton: {
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
});
