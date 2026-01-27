import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LibraryScreen from '../screens/LibraryScreen';
import GameNiteToolsScreen from '../screens/GameNiteToolsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1e293b',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
            paddingTop: 8,
            paddingBottom: 8,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Library"
          component={LibraryScreen}
          options={{
            tabBarLabel: 'Library',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24, color }}>📚</Text>
            ),
          }}
        />
        <Tab.Screen
          name="GameNiteTools"
          component={GameNiteToolsScreen}
          options={{
            tabBarLabel: 'Tools',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24, color }}>🎲</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24, color }}>👤</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
