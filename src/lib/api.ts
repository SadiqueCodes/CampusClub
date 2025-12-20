import supabase from './supabase';
import Constants from 'expo-constants';

const extras: Record<string, any> = (Constants.expoConfig && (Constants.expoConfig.extra as Record<string, any>)) || (Constants.manifest && (Constants.manifest.extra as Record<string, any>)) || {};
const BACKEND_URL = extras.BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8080';

export async function postMessage(chatId: string, text: string) {
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
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to post message: ${res.status} ${body}`);
  }

  return res.json();
}

// Wrapper that will use backend if configured, otherwise fall back to direct insert
export async function postMessageSmart(chatId: string, text: string) {
  if (BACKEND_URL && BACKEND_URL !== '') {
    return postMessage(chatId, text);
  }
  return postMessageDirect(chatId, text);
}

// If BACKEND_URL is not configured, fall back to inserting directly into Supabase (useful for dev)
// Note: this requires your Supabase RLS/policies to allow the client to insert messages.
export async function postMessageDirect(chatId: string, text: string) {
  const { data, error } = await supabase.from('messages').insert([{ chat_id: chatId, text }]).select().single();
  if (error) throw error;
  return { data };
}

export async function createClub(payload: { name: string; type: string; description?: string }) {
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

export async function createChat(payload: { participant_ids: string[]; name?: string; club_id?: string }) {
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

export default { postMessage, createClub, createChat, updateClub };
