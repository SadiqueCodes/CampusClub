import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { JoinRequest } from '../types';
import supabase from '../lib/supabase';
import api, { isBackendConfigured } from '../lib/api';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const joinRequests = useStore((state) => state.joinRequests);
  const clubs = useStore((state) => state.clubs);
  const currentUser = useStore((state) => state.currentUser);
  const updateJoinRequest = useStore((state) => state.updateJoinRequest);
  const chats = useStore((state) => state.chats);
  const updateChat = useStore((state) => state.updateChat);
  const addMemberToClub = useStore((state) => state.addMemberToClub);
  const fetchChats = useStore((state) => state.fetchChats);
  const fetchClubs = useStore((state) => state.fetchClubs);
  const fetchJoinRequests = useStore((state) => state.fetchJoinRequests);
  const myId = currentUser?.id || '';
  const [statusOverrides, setStatusOverrides] = useState<Record<string, JoinRequest['status']>>({});
  const [processingRequestIds, setProcessingRequestIds] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<'invites' | 'applications' | 'incoming' | 'sent'>('invites');

  useEffect(() => {
    // Drop optimistic overrides once store has caught up.
    setStatusOverrides((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(prev).forEach((requestId) => {
        const latest = joinRequests.find((r) => r.id === requestId);
        if (!latest || latest.status === prev[requestId]) {
          delete next[requestId];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [joinRequests]);

  const getEffectiveStatus = (request: JoinRequest): JoinRequest['status'] =>
    statusOverrides[request.id] || request.status;

  const runRequestAction = async (
    request: JoinRequest,
    optimisticStatus: JoinRequest['status'],
    action: () => Promise<void>
  ) => {
    if (processingRequestIds[request.id]) return;
    const previousStatus = getEffectiveStatus(request);

    setProcessingRequestIds((prev) => ({ ...prev, [request.id]: true }));
    setStatusOverrides((prev) => ({ ...prev, [request.id]: optimisticStatus }));

    try {
      await action();
    } catch (err) {
      setStatusOverrides((prev) => ({ ...prev, [request.id]: previousStatus }));
      throw err;
    } finally {
      setProcessingRequestIds((prev) => ({ ...prev, [request.id]: false }));
    }
  };

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

  const addUserToClub = async (clubId: string, userId: string) => {
    const club = clubs.find((c) => c.id === clubId);
    if (!club) return;

    // Add to club members
    if (!(club.memberIds || []).includes(userId)) {
      await addMemberToClub(club.id, userId);
    }

    // Add to chat participants and persist to database
    const clubChat = chats.find((chat) => chat.clubId === clubId);
    if (clubChat && !(clubChat.participantIds || []).includes(userId)) {
      const updatedParticipants = [...(clubChat.participantIds || []), userId];
      updateChat(clubChat.id, { participantIds: updatedParticipants });
      
      // Persist to Supabase
      try {
        await supabase
          .from('chats')
          .update({ participant_ids: updatedParticipants })
          .eq('id', clubChat.id);
      } catch (err) {
        console.warn('Failed to update chat participants in database', err);
      }
    }
  };

  const handleApplicationDecision = async (request: JoinRequest, decision: 'accepted' | 'rejected') => {
    await runRequestAction(request, decision, async () => {
    if (isBackendConfigured()) {
      try {
        await api.respondJoinRequest(request.id, decision);
        await Promise.all([fetchClubs(), fetchChats(), fetchJoinRequests()]);
        return;
      } catch (err) {
        console.warn('Backend respondJoinRequest failed, falling back to local flow', err);
      }
    }

    if (decision === 'accepted') {
      await addUserToClub(request.clubId, request.userId);
      try {
        await fetchChats();
      } catch (err) {
        console.warn('Failed to refetch chats after accepting', err);
      }
    }
    await updateJoinRequest(request.id, { status: decision, respondedAt: new Date() });
    });
  };

  const handleInvitationDecision = async (
    request: JoinRequest,
    decision: 'accepted' | 'rejected'
  ) => {
    await runRequestAction(request, decision, async () => {
    if (isBackendConfigured()) {
      try {
        await api.respondJoinRequest(request.id, decision);
        await Promise.all([fetchClubs(), fetchChats(), fetchJoinRequests()]);
        return;
      } catch (err) {
        console.warn('Backend respondJoinRequest failed, falling back to local flow', err);
      }
    }

    if (decision === 'accepted' && request.userId === myId) {
      await addUserToClub(request.clubId, request.userId);
      // Refetch chats so we can see the group chat
      try {
        await fetchChats();
      } catch (err) {
        console.warn('Failed to refetch chats after accepting invitation', err);
      }
    }
    await updateJoinRequest(request.id, { status: decision, respondedAt: new Date() });
    });
  };

  const handleCancelRequest = async (request: JoinRequest) => {
    await runRequestAction(request, 'cancelled', async () => {
      await updateJoinRequest(request.id, { status: 'cancelled', respondedAt: new Date() });
    });
  };

  const handleCancelInvite = async (request: JoinRequest) => {
    await runRequestAction(request, 'cancelled', async () => {
      await updateJoinRequest(request.id, { status: 'cancelled', respondedAt: new Date() });
    });
  };

  const renderStatusBadge = (request: JoinRequest) => {
    const statusMeta = requestStatusMeta[getEffectiveStatus(request)];
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
  const renderSectionHeader = (icon: any, title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIconBadge}>
          <Ionicons name={icon} size={16} color="#6B7280" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionCountBadge}>
        <Text style={styles.sectionCountText}>{count}</Text>
      </View>
    </View>
  );

  const pendingInvitesForMe = receivedInvitations.filter((request) => getEffectiveStatus(request) === 'pending');
  const pendingApplications = myApplications.filter((request) => getEffectiveStatus(request) === 'pending');
  const pendingIncoming = incomingRequests.filter((request) => getEffectiveStatus(request) === 'pending');
  const pendingSentInvites = sentInvites.filter((request) => getEffectiveStatus(request) === 'pending');

  const summaryTiles = useMemo(
    () =>
      [
        {
          key: 'invitationsForMe',
          title: 'Invites for you',
          count: pendingInvitesForMe.length,
          icon: 'mail-unread',
          color: '#B06579',
        },
        {
          key: 'myApplications',
          title: 'My applications',
          count: pendingApplications.length,
          icon: 'paper-plane',
          color: '#4B5563',
        },
        {
          key: 'incoming',
          title: 'Incoming requests',
          count: pendingIncoming.length,
          icon: 'people-circle',
          color: '#047857',
        },
        {
          key: 'sent',
          title: 'Invites you sent',
          count: pendingSentInvites.length,
          icon: 'send',
          color: '#C2410C',
        },
      ].sort((a, b) => {
        const aHas = a.count > 0 ? 1 : 0;
        const bHas = b.count > 0 ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas;
        return b.count - a.count;
      }),
    [pendingInvitesForMe.length, pendingApplications.length, pendingIncoming.length, pendingSentInvites.length]
  );
  useEffect(() => {
    if (!summaryTiles.length) return;
    const first = summaryTiles[0].key;
    const mapped =
      first === 'invitationsForMe'
        ? 'invites'
        : first === 'myApplications'
        ? 'applications'
        : first === 'incoming'
        ? 'incoming'
        : 'sent';
    setActiveSection(mapped);
  }, [summaryTiles]);

  const activeSectionMeta =
    activeSection === 'invites'
      ? { icon: 'gift-outline', title: 'Invitations for you', count: pendingInvitesForMe.length }
      : activeSection === 'applications'
      ? { icon: 'paper-plane-outline', title: 'My applications', count: pendingApplications.length }
      : activeSection === 'incoming'
      ? { icon: 'shield-checkmark-outline', title: 'Incoming requests (your clubs)', count: pendingIncoming.length }
      : { icon: 'sparkles-outline', title: 'Invites you sent', count: pendingSentInvites.length };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E372A1', '#CE678A', '#B06579']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>Club invites and requests</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
            {summaryTiles.map((tile, index) => (
              <TouchableOpacity
                key={tile.key}
                onPress={() =>
                  setActiveSection(
                    tile.key === 'invitationsForMe'
                      ? 'invites'
                      : tile.key === 'myApplications'
                      ? 'applications'
                      : tile.key === 'incoming'
                      ? 'incoming'
                      : 'sent'
                  )
                }
                style={[
                  styles.summaryTile,
                  { marginRight: index === summaryTiles.length - 1 ? 0 : 10 },
                  ((tile.key === 'invitationsForMe' && activeSection === 'invites') ||
                    (tile.key === 'myApplications' && activeSection === 'applications') ||
                    (tile.key === 'incoming' && activeSection === 'incoming') ||
                    (tile.key === 'sent' && activeSection === 'sent')) &&
                    styles.summaryTileActive,
                ]}
              >
                <View style={styles.summaryTileHeader}>
                  <Ionicons name={tile.icon as any} size={16} color={tile.color as string} />
                  <Text style={styles.summaryTileLabel}>{tile.title}</Text>
                </View>
                <Text style={styles.summaryTileCount}>{tile.count}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          {renderSectionHeader(activeSectionMeta.icon, activeSectionMeta.title, activeSectionMeta.count)}

          {activeSection === 'invites' &&
            (pendingInvitesForMe.length === 0 ? (
            renderEmptyState('No invites yet. Club leads can invite you to join.')
          ) : (
            pendingInvitesForMe.map((request) => {
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
                  {getEffectiveStatus(request) === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.declineButton, processingRequestIds[request.id] && styles.actionButtonDisabled]}
                        onPress={() => handleInvitationDecision(request, 'rejected')}
                        disabled={!!processingRequestIds[request.id]}
                      >
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.acceptButton, processingRequestIds[request.id] && styles.actionButtonDisabled]}
                        onPress={() => handleInvitationDecision(request, 'accepted')}
                        disabled={!!processingRequestIds[request.id]}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          ))}

          {activeSection === 'applications' &&
            (pendingApplications.length === 0 ? (
            renderEmptyState("You haven't requested to join any clubs yet.")
          ) : (
            pendingApplications.map((request) => {
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
                  {getEffectiveStatus(request) === 'pending' && (
                    <TouchableOpacity
                      style={[styles.cancelButton, processingRequestIds[request.id] && styles.actionButtonDisabled]}
                      onPress={() => handleCancelRequest(request)}
                      disabled={!!processingRequestIds[request.id]}
                    >
                      <Text style={styles.cancelButtonText}>Cancel request</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ))}

          {activeSection === 'incoming' &&
            (pendingIncoming.length === 0 ? (
            renderEmptyState('No new join requests yet. Members will appear here.')
          ) : (
            pendingIncoming.map((request) => {
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
                  {getEffectiveStatus(request) === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.declineButton, processingRequestIds[request.id] && styles.actionButtonDisabled]}
                        onPress={() => handleApplicationDecision(request, 'rejected')}
                        disabled={!!processingRequestIds[request.id]}
                      >
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.acceptButton, processingRequestIds[request.id] && styles.actionButtonDisabled]}
                        onPress={() => handleApplicationDecision(request, 'accepted')}
                        disabled={!!processingRequestIds[request.id]}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          ))}

          {activeSection === 'sent' &&
            (pendingSentInvites.length === 0 ? (
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
                  {getEffectiveStatus(request) === 'pending' && (
                    <TouchableOpacity
                      style={[styles.cancelButton, processingRequestIds[request.id] && styles.actionButtonDisabled]}
                      onPress={() => handleCancelInvite(request)}
                      disabled={!!processingRequestIds[request.id]}
                    >
                      <Text style={styles.cancelButtonText}>Cancel invite</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ))}
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
    paddingBottom: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 18,
  },
  summaryScroll: {
    paddingVertical: 4,
    paddingRight: 8,
    paddingLeft: 0,
    flexGrow: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTile: {
    minWidth: 150,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTileActive: {
    borderColor: '#E372A1',
    backgroundColor: '#FFF5F8',
  },
  summaryTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTileLabel: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryTileCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountBadge: {
    minWidth: 26,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: 14,
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
  actionButtonDisabled: {
    opacity: 0.55,
  },
});
