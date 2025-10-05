import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
  onStart?: () => void;
}

export default function SplashScreen({ onAnimationComplete, onStart }: SplashScreenProps) {
  const pickaxeRotation = useSharedValue(0);
  const pickaxeTranslateY = useSharedValue(0);
  const chestScale = useSharedValue(1);
  const sparkleOpacity = useSharedValue(0);
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    // Call onStart immediately to hide native splash
    onStart?.();
    
    // Start the animation sequence
    const startAnimation = () => {
      // Pickaxe swing animation
      pickaxeRotation.value = withSequence(
        withTiming(-30, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(15, { duration: 200, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 150 })
      );

      pickaxeTranslateY.value = withSequence(
        withTiming(-10, { duration: 300 }),
        withTiming(5, { duration: 200 }),
        withTiming(0, { duration: 150 })
      );

      // Chest impact animation
      chestScale.value = withDelay(
        500,
        withSequence(
          withTiming(0.95, { duration: 100 }),
          withTiming(1.05, { duration: 100 }),
          withTiming(1, { duration: 100 })
        )
      );

      // Sparkle effect
      sparkleOpacity.value = withDelay(
        500,
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 300 })
        )
      );

      // Fade out after animation
      fadeOut.value = withDelay(
        1500,
        withTiming(0, { duration: 500 }, () => {
          runOnJS(onAnimationComplete)();
        })
      );
    };

    // Start animation immediately, no delay
    const timer = setTimeout(startAnimation, 100);
    return () => clearTimeout(timer);
  }, [onStart]);

  const pickaxeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: pickaxeTranslateY.value },
      { rotate: `${pickaxeRotation.value}deg` },
    ],
  }));

  const chestAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chestScale.value }],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Sparkle effects */}
      <Animated.View style={[styles.sparkleContainer, sparkleAnimatedStyle]}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.sparkle,
              {
                left: width / 2 + (Math.cos((index * 60) * Math.PI / 180) * 80),
                top: height / 2 + (Math.sin((index * 60) * Math.PI / 180) * 80),
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Chest */}
      <Animated.View style={[styles.chestContainer, chestAnimatedStyle]}>
        <View style={styles.chest}>
          <View style={styles.chestLid} />
          <View style={styles.chestBody}>
            <View style={styles.chestBand} />
            <View style={styles.chestBand} />
            <View style={styles.chestLock}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Pickaxe */}
      <Animated.View style={[styles.pickaxeContainer, pickaxeAnimatedStyle]}>
        <View style={styles.pickaxe}>
          <View style={styles.pickaxeHead} />
          <View style={styles.pickaxeHandle} />
        </View>
      </Animated.View>

      {/* App Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>TROVE</Text>
        <Text style={styles.subtitle}>Discover Your Treasures</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chestContainer: {
    position: 'absolute',
    top: height / 2 - 60,
    left: width / 2 - 75,
  },
  pickaxeContainer: {
    position: 'absolute',
    top: height / 2 - 120,
    left: width / 2 - 40,
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#FFD700',
    borderRadius: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  chest: {
    width: 150,
    height: 120,
    position: 'relative',
  },
  chestLid: {
    width: 150,
    height: 40,
    backgroundColor: '#E6B887',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#8B4513',
    position: 'absolute',
    top: 0,
  },
  chestBody: {
    width: 150,
    height: 80,
    backgroundColor: '#D4A574',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#8B4513',
    position: 'absolute',
    top: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chestBand: {
    width: 140,
    height: 4,
    backgroundColor: '#654321',
    marginVertical: 8,
  },
  chestLock: {
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#B8860B',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 25,
  },
  lockIcon: {
    fontSize: 12,
    color: '#8B4513',
  },
  pickaxe: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  pickaxeHead: {
    width: 60,
    height: 15,
    backgroundColor: '#C0C0C0',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#808080',
    position: 'absolute',
    top: 20,
    left: 10,
    transform: [{ rotate: '45deg' }],
  },
  pickaxeHandle: {
    width: 6,
    height: 50,
    backgroundColor: '#8B4513',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#654321',
    position: 'absolute',
    top: 30,
    left: 37,
  },
  titleContainer: {
    position: 'absolute',
    bottom: height * 0.2,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#8B4513',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#D4A574',
    marginTop: 8,
    fontStyle: 'italic',
  },
});