import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LoginScreen } from './src/screens';
import { TabNavigator } from './src/navigation/TabNavigator';
import { useStore } from './src/store';

export default function App() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        {isAuthenticated ? <TabNavigator /> : <LoginScreen />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
