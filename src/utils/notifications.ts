import { emitInAppAlert } from './inAppAlerts';

export const notifiedJoinRequestIds = new Set<string>();

export const notifyJoinRequest = (title: string, message: string, requestId?: string) => {
  if (requestId && notifiedJoinRequestIds.has(requestId)) return;
  if (requestId) {
    notifiedJoinRequestIds.add(requestId);
  }
  emitInAppAlert({ title, message });
};
