import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function Splash() {
  const router = useRouter();

  // Animations
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(12)).current;
  const ringScale = useRef(new Animated.Value(0.85)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      // Logo fades + scales in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 14,
          stiffness: 120,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
      // Tagline slides up after logo appears
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]),
    ]).start();

    // Breathing ring loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.15,
            duration: 1400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sine),
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 0.85,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Navigate after 2.2s
    const timer = setTimeout(async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/auth');
        }
      } catch {
        router.replace('/auth');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Soft radial glow behind logo */}
      <View style={styles.glow} />

      {/* Breathing ring */}
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />

      {/* Mascot + tagline */}
      <Animated.View
        style={[
          styles.logoWrap,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <Image
          source={require('../assets/images/mascot.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.textWrap,
          { opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
        ]}
      >
        <Text style={styles.tagline}>เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน</Text>
      </Animated.View>

      {/* Bottom pulse bar */}
      <Animated.View style={[styles.bottomBar, { opacity: taglineOpacity }]}>
        <View style={styles.barTrack}>
          <ProgressBar />
        </View>
      </Animated.View>
    </View>
  );
}

// Animated progress bar that fills from 0→100% over 2s
function ProgressBar() {
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: 1,
      duration: 2000,
      delay: 400,
      useNativeDriver: false,
      easing: Easing.out(Easing.quad),
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.barFill,
        {
          width: barWidth.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        },
      ]}
    />
  );
}

const PINK = '#ef5ea8';
const PINK_DARK = '#d94d94';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PINK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Soft radial highlight
  glow: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: height * 0.5 - width * 0.6,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mascotImage: {
    width: 220,
    height: 220,
    borderRadius: 48,
    overflow: 'hidden',
  },
  textWrap: {
    alignItems: 'center',
    gap: 8,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 56,
    left: 48,
    right: 48,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});
