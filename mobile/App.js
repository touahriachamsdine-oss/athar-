import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import DashboardScreen from './screens/DashboardScreen';
import ExploreScreen from './screens/ExploreScreen';
import CreateScreen from './screens/CreateScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';

const Tab = createBottomTabNavigator();

export default function App() {
    // Demo session placeholder: the native app mirrors the web platform's
    // demo mode until supabase credentials are configured in supabase.js.
    const session = true;

    if (!session) return <AuthScreen />;

    return (
        <>
            <StatusBar style="light" />
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={{
                        headerShown: false,
                        tabBarStyle: { backgroundColor: '#04060F', borderTopColor: '#00FFB233' },
                        tabBarActiveTintColor: '#00FFB2',
                    }}
                >
                    <Tab.Screen name="Dashboard" component={DashboardScreen} />
                    <Tab.Screen name="Explore" component={ExploreScreen} />
                    <Tab.Screen name="Create" component={CreateScreen} />
                    <Tab.Screen name="Alerts" component={NotificationsScreen} />
                    <Tab.Screen name="Profile" component={ProfileScreen} />
                </Tab.Navigator>
            </NavigationContainer>
        </>
    );
}