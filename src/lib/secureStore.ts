import * as SecureStore from 'expo-secure-store';

// SecureStore keys must only contain alphanumeric characters, '.', '-' or '_'
// (Expo SecureStore will reject other characters like ':'). Use a safe prefix.
const PREFIX = 'campusclub_';

export async function setItem(key: string, value: string) {
  if (!key || typeof key !== 'string') {
    console.warn('SecureStore setItem called with invalid key', key);
    return;
  }
  const composed = PREFIX + key;
  try {
    await SecureStore.setItemAsync(composed, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  } catch (err) {
    console.warn('SecureStore setItem error', err);
  }
}

export async function getItem(key: string) {
  if (!key || typeof key !== 'string') {
    console.warn('SecureStore getItem called with invalid key', key);
    return null;
  }
  const composed = PREFIX + key;
  try {
    if (__DEV__) {
      // Helpful dev debug to trace invalid-key calls
      // eslint-disable-next-line no-console
      console.debug('[secureStore] getItem key:', composed);
    }
    return await SecureStore.getItemAsync(composed);
  } catch (err) {
    console.warn('SecureStore getItem error', err);
    return null;
  }
}

export async function deleteItem(key: string) {
  if (!key || typeof key !== 'string') {
    console.warn('SecureStore deleteItem called with invalid key', key);
    return;
  }
  const composed = PREFIX + key;
  try {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug('[secureStore] deleteItem key:', composed);
    }
    await SecureStore.deleteItemAsync(composed);
  } catch (err) {
    console.warn('SecureStore deleteItem error', err);
  }
}

export default { setItem, getItem, deleteItem };
