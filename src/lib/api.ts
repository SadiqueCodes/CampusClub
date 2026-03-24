import supabase from './supabase';
import Constants from 'expo-constants';

const extras: Record<string, any> =
  (Constants.expoConfig && (Constants.expoConfig.extra as Record<string, any>)) ||
  (Constants.manifest && (Constants.manifest.extra as Record<string, any>)) ||
  {};

const trimIfString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const resolvedBackendUrl =
  trimIfString(extras.BACKEND_URL) ||
  trimIfString(process.env.BACKEND_URL) ||
  trimIfString((process.env as any).EXPO_PUBLIC_BACKEND_URL);

const BACKEND_URL = resolvedBackendUrl;
export const isBackendConfigured = () => BACKEND_URL.length > 0;

export async function postMessage(chatId: string, text: string, attachments?: string[]) {
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured. Set BACKEND_URL in app extras or environment.');
  }

  // Dev log
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.debug('[api] POST', `${BACKEND_URL}/api/messages`);
  }

  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ chat_id: chatId, text, attachments: attachments || [] }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to post message: ${res.status} ${body}`);
  }

  return res.json();
}

// Wrapper that will use backend if configured, otherwise fall back to direct insert
export async function postMessageSmart(chatId: string, text: string, attachments?: string[]) {
  if (isBackendConfigured()) {
    return postMessage(chatId, text, attachments);
  }
  return postMessageDirect(chatId, text, attachments);
}

// If BACKEND_URL is not configured, fall back to inserting directly into Supabase (useful for dev)
// Note: this requires your Supabase RLS/policies to allow the client to insert messages.
export async function postMessageDirect(chatId: string, text: string, attachments?: string[]) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  const userName = userData?.user?.user_metadata?.name || userData?.user?.email || 'Member';

  const { data, error } = await supabase
    .from('messages')
    .insert([{ chat_id: chatId, text, sender_id: userId, sender_name: userName, attachments: attachments || [] }])
    .select()
    .single();
  if (error) throw error;
  return { data };
}

export async function createClub(payload: {
  name: string;
  type: string;
  description?: string;
  college_id?: string;
  college_name?: string;
}) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/clubs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create club: ${res.status} ${body}`);
  }
  return res.json();
}

export async function createChat(payload: { participant_ids: string[]; name?: string; club_id?: string; type?: 'group' | 'direct' }) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create chat: ${res.status} ${body}`);
  }
  return res.json();
}

export async function updateClub(clubId: string, updates: Record<string, any>) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/clubs/${clubId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to update club: ${res.status} ${body}`);
  }
  return res.json();
}

export async function leaveClub(clubId: string) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/clubs/${clubId}/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to leave club: ${res.status} ${body}`);
  }
  return res.json();
}

export async function createEvent(payload: {
  title: string;
  description?: string;
  club_id: string;
  club_name?: string;
  college_id?: string | null;
  college_name?: string | null;
  date: string;
  time?: string;
  location?: string;
  banner_image?: string | null;
  created_by?: string;
}) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create event: ${res.status} ${body}`);
  }
  return res.json();
}

export async function respondJoinRequest(requestId: string, decision: 'accepted' | 'rejected') {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/join-requests/${requestId}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ decision }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to respond to join request: ${res.status} ${body}`);
  }
  return res.json();
}

export async function searchGifs(query: string, limit = 24) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;
  const url = `${BACKEND_URL.replace(/\/$/, '')}/api/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to search GIFs: ${res.status} ${body}`);
  }
  return res.json();
}

export async function get(endpoint: string) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch: ${res.status} ${body}`);
  }
  return res.json();
}

export async function post(endpoint: string, payload: any) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to post ${path}: ${res.status} ${body}`);
  }
  return res.json();
}

export async function put(endpoint: string, payload: any) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to put ${path}: ${res.status} ${body}`);
  }
  return res.json();
}

export async function patch(endpoint: string, payload: any) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to patch ${path}: ${res.status} ${body}`);
  }
  return res.json();
}

export async function del(endpoint: string) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL not configured.');
  }
  const sessionRes = await supabase.auth.getSession();
  const token = (sessionRes as any)?.data?.session?.access_token;

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to delete ${path}: ${res.status} ${body}`);
  }
  return res.json();
}

export default { postMessage, createClub, createChat, createEvent, updateClub, leaveClub, respondJoinRequest, searchGifs, get, post, put, patch, del };
