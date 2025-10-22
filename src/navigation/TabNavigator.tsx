import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateClubScreen } from '../screens/CreateClubScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.colors.blue.indigo,
        tabBarInactiveTintColor: theme.colors.text.darkGrey,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '🏠' : '🏠'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateClubScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '➕' : '➕'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '💬' : '💬'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>{focused ? '👤' : '👤'}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};
