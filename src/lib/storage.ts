import Constants from 'expo-constants';
import supabase from './supabase';

const extras: Record<string, any> =
  (Constants.expoConfig && (Constants.expoConfig.extra as Record<string, any>)) ||
  (Constants.manifest && (Constants.manifest.extra as Record<string, any>)) ||
  {};

const MARKETPLACE_BUCKET = extras.MARKETPLACE_BUCKET || 'marketplace';

const fetchUriAsArrayBuffer = async (uri: string) => {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from uri ${uri}`);
  }
  return { arrayBuffer: await response.arrayBuffer(), type: response.headers.get('content-type') || 'image/jpeg' };
};

export const uploadImageToSupabase = async (uri: string, folder: string, bucket = MARKETPLACE_BUCKET) => {
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { arrayBuffer, type } = await fetchUriAsArrayBuffer(uri);
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, arrayBuffer, {
    cacheControl: '3600',
    upsert: false,
    contentType: type,
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
};

export const getMarketplaceBucketName = () => MARKETPLACE_BUCKET;
