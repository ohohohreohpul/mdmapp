import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { COLORS, SHADOWS } from '../../constants/theme';

// Frosted glass tab bar background — real blur on iOS, fallback on Android/web
function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={85}
        tint="systemUltraThinMaterialLight"
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: 'rgba(255, 255, 255, 0.96)' },
      ]}
    />
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
    {/* Pink mascot strip that fills the iOS safe-area gap at the bottom */}
    {Platform.OS === 'web' && (
      <View style={styles.mascotStrip} pointerEvents="none">
        <Image
          source={require('../../assets/images/mascot.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>
    )}
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 0 : insets.bottom + 6,
          left: 20,
          right: 20,
          elevation: 0,
          borderRadius: 9999,
          height: 66,
          paddingBottom: 8,
          paddingTop: 8,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.55)',
          overflow: 'hidden',
          ...SHADOWS.tab,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 1,
          letterSpacing: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'หน้าแรก',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={focused ? '#FFFFFF' : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'สำรวจ',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={20}
                color={focused ? '#FFFFFF' : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'งาน',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? 'briefcase' : 'briefcase-outline'}
                size={20}
                color={focused ? '#FFFFFF' : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: 'เรียน',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                size={20}
                color={focused ? '#FFFFFF' : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={20}
                color={focused ? '#FFFFFF' : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 42,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 0,
  },
  mascotImage: {
    width: 80,
    height: 60,
    marginBottom: -8,
  },
  iconWrapActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
});
