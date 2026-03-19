import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const checkUserAndNavigate = async () => {
      try {
        // Check if user has completed onboarding before
        const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
        const userData = await AsyncStorage.getItem('user');
        
        // Wait a bit for splash animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (hasOnboarded === 'true' || userData) {
          // User has onboarded before, go directly to main app
          router.replace('/(tabs)/home');
        } else {
          // First time user, show onboarding
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        router.replace('/onboarding');
      }
    };

    checkUserAndNavigate();
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo-wordmark.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Tagline */}
      <Text style={styles.tagline}>เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน</Text>

      {/* Loading dots */}
      <View style={styles.loadingContainer}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: width * 0.6,
    height: width * 0.25,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryLight,
  },
  dot1: {
    opacity: 1,
    backgroundColor: COLORS.primary,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 0.4,
  },
});
