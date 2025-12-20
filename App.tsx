import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LoginScreen } from './src/screens';
import { TabNavigator } from './src/navigation/TabNavigator';
import { useStore } from './src/store';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import supabase from './src/lib/supabase';

export default function App() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const initializeAuth = useStore((s) => s.initializeAuth);
  const authInitializing = useStore((s) => s.authInitializing);

  useEffect(() => {
    initializeAuth();

    // Deep link handler: capture auth redirects from email magic links.
    const parseParamsFromUrl = (url: string) => {
      try {
        // Split hash and query parts; Supabase may append tokens in the fragment (#) or query (?);
        const [basePart, hashPart] = url.split('#');
        const queryPart = basePart.includes('?') ? basePart.split('?')[1] : '';
        const combined = [queryPart, hashPart].filter(Boolean).join('&');
        const params = new URLSearchParams(combined);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        return { access_token, refresh_token };
      } catch (e) {
        console.warn('parseParamsFromUrl error', e);
        return { access_token: null, refresh_token: null };
      }
    };

    const handleUrl = async (event: { url: string } | string) => {
      const url = typeof event === 'string' ? event : event.url;
      if (!url) return;
      const { access_token, refresh_token } = parseParamsFromUrl(url);
      if (access_token && refresh_token) {
        try {
          // Try to set session directly from tokens supplied by the magic-link redirect
          // @ts-ignore - setSession may differ between SDK versions
          await supabase.auth.setSession({ access_token, refresh_token });
        } catch (e) {
          console.warn('Failed to set supabase session from deep link', e);
        }
        // Re-run store initialization to pick up the new session and fetch data
        initializeAuth();
      }
    };

    // Handle initial URL that opened the app
    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleUrl(initialUrl);
        }
      } catch (e) {
        console.warn('Linking.getInitialURL error', e);
      }
    })();

    const subscription = Linking.addEventListener('url', handleUrl as any);
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authInitializing) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E372A1" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        {isAuthenticated ? <TabNavigator /> : <LoginScreen />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
