import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LoginScreen } from './src/screens';
import { TabNavigator } from './src/navigation/TabNavigator';
import { useStore } from './src/store';
import { View, ActivityIndicator, StyleSheet, Linking, Image, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import supabase from './src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { subscribeInAppAlert } from './src/utils/inAppAlerts';

const navigationRef = createNavigationContainerRef<any>();

export default function App() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const initializeAuth = useStore((s) => s.initializeAuth);
  const authInitializing = useStore((s) => s.authInitializing);
  const pendingEventIdRef = useRef<string | null>(null);
  const [alertVisible, setAlertVisible] = React.useState(false);
  const [alertTitle, setAlertTitle] = React.useState('');
  const [alertMessage, setAlertMessage] = React.useState('');

  useEffect(() => {
    const parseEventIdFromUrl = (url: string) => {
      try {
        const noScheme = url.replace(/^[a-zA-Z]+:\/\//, '');
        const pathPart = noScheme.split(/[?#]/)[0] || '';
        const parts = pathPart.split('/').filter(Boolean);
        if (parts[0]?.toLowerCase() === 'event' && parts[1]) {
          return decodeURIComponent(parts[1]);
        }
      } catch (e) {
        // ignore parse errors
      }
      return null;
    };

    const tryNavigateToEvent = (eventId: string) => {
      if (!navigationRef.isReady()) return false;
      navigationRef.navigate('Home', {
        screen: 'EventDetail',
        params: { eventId },
      });
      return true;
    };

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
      const eventId = parseEventIdFromUrl(url);
      if (eventId) {
        if (!(isAuthenticated && tryNavigateToEvent(eventId))) {
          pendingEventIdRef.current = eventId;
        }
      }
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
  }, [initializeAuth, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !navigationRef.isReady()) return;
    if (!pendingEventIdRef.current) return;
    navigationRef.navigate('Home', {
      screen: 'EventDetail',
      params: { eventId: pendingEventIdRef.current },
    });
    pendingEventIdRef.current = null;
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = subscribeInAppAlert((payload) => {
      setAlertTitle(payload.title);
      setAlertMessage(payload.message);
      setAlertVisible(true);
    });
    return unsubscribe;
  }, []);

  if (authInitializing) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.splashContainer}>
          <View style={styles.logoWrap}>
            <Image source={require('./assets/icon.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.appTitle}>CampusClub</Text>
          <Text style={styles.appSubtitle}>Connecting your campus community</Text>
          <ActivityIndicator size="small" color="#E372A1" style={{ marginTop: 18 }} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            if (!isAuthenticated || !pendingEventIdRef.current) return;
            navigationRef.navigate('Home', {
              screen: 'EventDetail',
              params: { eventId: pendingEventIdRef.current },
            });
            pendingEventIdRef.current = null;
          }}
        >
          <StatusBar style="auto" />
          {isAuthenticated ? <TabNavigator /> : <LoginScreen />}
        </NavigationContainer>

        <Modal
          visible={alertVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          presentationStyle="overFullScreen"
          onRequestClose={() => setAlertVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setAlertVisible(false)}>
            <View style={styles.alertOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.alertRoot}>
            <View style={styles.alertCard}>
              <View style={styles.alertIconWrap}>
                <Ionicons name="notifications" size={24} color="#B06579" />
              </View>
              <Text style={styles.alertTitle}>{alertTitle}</Text>
              <Text style={styles.alertMessage}>{alertMessage}</Text>
              <TouchableOpacity style={styles.alertButton} onPress={() => setAlertVisible(false)}>
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: '#FFF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  logo: {
    width: 84,
    height: 84,
  },
  appTitle: {
    marginTop: 18,
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  appSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  alertRoot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  alertCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  alertIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  alertButton: {
    marginTop: 16,
    backgroundColor: '#B06579',
    borderRadius: 12,
    minWidth: 116,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
