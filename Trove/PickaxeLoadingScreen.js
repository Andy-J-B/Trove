import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const PickaxeLoadingScreen = () => {
  const pickaxeRotation = useRef(new Animated.Value(0)).current;
  const pickaxeTranslateY = useRef(new Animated.Value(0)).current;
  const chestScale = useRef(new Animated.Value(1)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animatePickaxe = () => {
      // Pickaxe swing animation
      Animated.sequence([
        // Lift up and rotate back
        Animated.parallel([
          Animated.timing(pickaxeRotation, {
            toValue: -0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pickaxeTranslateY, {
            toValue: -20,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Strike down
        Animated.parallel([
          Animated.timing(pickaxeRotation, {
            toValue: 0.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pickaxeTranslateY, {
            toValue: 10,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Return to neutral
        Animated.parallel([
          Animated.timing(pickaxeRotation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pickaxeTranslateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Repeat the animation
        setTimeout(animatePickaxe, 500);
      });
    };

    const animateChest = () => {
      // Chest impact animation
      Animated.sequence([
        Animated.timing(chestScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // Impact shake
        Animated.timing(chestScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(chestScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(animateChest, 900);
      });
    };

    const animateSparkles = () => {
      // Sparkle effect on impact
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(animateSparkles, 900);
      });
    };

    animatePickaxe();
    animateChest();
    animateSparkles();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        {/* Sparkle effects */}
        <Animated.View
          style={[
            styles.sparkles,
            {
              opacity: sparkleOpacity,
            },
          ]}
        >
          <Text style={styles.sparkle}>✨</Text>
          <Text style={[styles.sparkle, { left: 20, top: -10 }]}>✨</Text>
          <Text style={[styles.sparkle, { left: -15, top: 5 }]}>✨</Text>
        </Animated.View>

        {/* Pickaxe */}
        <Animated.View
          style={[
            styles.pickaxe,
            {
              transform: [
                { translateY: pickaxeTranslateY },
                { rotate: pickaxeRotation.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-57.3deg', '57.3deg'],
                  })
                },
              ],
            },
          ]}
        >
          <View style={styles.pickaxeHandle} />
          <View style={styles.pickaxeHead} />
        </Animated.View>

        {/* Chest */}
        <Animated.View
          style={[
            styles.chest,
            {
              transform: [{ scale: chestScale }],
            },
          ]}
        >
          <View style={styles.chestBody}>
            <View style={styles.chestLid} />
            <View style={styles.chestLock} />
            <View style={styles.chestBand} />
            <View style={[styles.chestBand, { top: 25 }]} />
          </View>
        </Animated.View>
      </View>

      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pickaxe: {
    position: 'absolute',
    top: 20,
    left: 50,
    transformOrigin: 'bottom center',
  },
  pickaxeHandle: {
    width: 6,
    height: 80,
    backgroundColor: '#8B4513',
    borderRadius: 3,
    marginBottom: 2,
  },
  pickaxeHead: {
    width: 40,
    height: 15,
    backgroundColor: '#C0C0C0',
    borderRadius: 2,
    position: 'absolute',
    top: -5,
    left: -17,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  chest: {
    position: 'absolute',
    bottom: 30,
  },
  chestBody: {
    width: 80,
    height: 60,
    backgroundColor: '#D2691E',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#8B4513',
    position: 'relative',
  },
  chestLid: {
    width: 74,
    height: 25,
    backgroundColor: '#CD853F',
    borderRadius: 6,
    position: 'absolute',
    top: -3,
    left: 0,
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  chestLock: {
    width: 12,
    height: 15,
    backgroundColor: '#FFD700',
    borderRadius: 6,
    position: 'absolute',
    top: 15,
    left: 34,
    borderWidth: 1,
    borderColor: '#B8860B',
  },
  chestBand: {
    width: 80,
    height: 4,
    backgroundColor: '#8B4513',
    position: 'absolute',
    top: 10,
    left: 0,
  },
  sparkles: {
    position: 'absolute',
    top: 60,
    left: 80,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
    color: '#FFD700',
  },
  loadingText: {
    marginTop: 40,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default PickaxeLoadingScreen;