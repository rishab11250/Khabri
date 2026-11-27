import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export function Kabootar({ size = 64, flap = false }) {
  const theme = useTheme();
  const wingAnim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!flap) return;
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wingAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(wingAnim, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bobAnim, {
            toValue: -2,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(bobAnim, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [flap, wingAnim, bobAnim]);

  const s = size / 64;

  const wingTranslateY = wingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5 * s],
  });
  const wingRotate = wingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '14deg'],
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={{
          width: 60 * s,
          height: 54 * s,
          position: 'relative',
          transform: [{ translateY: bobAnim }],
        }}
      >
        {/* Tail feathers */}
        <View
          style={{
            position: 'absolute',
            bottom: 13 * s,
            left: 2 * s,
            width: 18 * s,
            height: 7 * s,
            backgroundColor: theme.colors.muted,
            borderTopLeftRadius: 6 * s,
            borderBottomLeftRadius: 2 * s,
            transform: [{ rotate: '-28deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 9 * s,
            left: 4 * s,
            width: 15 * s,
            height: 6 * s,
            backgroundColor: theme.colors.ink,
            borderTopLeftRadius: 5 * s,
            borderBottomLeftRadius: 2 * s,
            transform: [{ rotate: '-12deg' }],
          }}
        />

        {/* Perched legs */}
        <View
          style={{
            position: 'absolute',
            bottom: 2 * s,
            left: 23 * s,
            width: 2.5 * s,
            height: 9 * s,
            backgroundColor: theme.colors.haldi,
            borderRadius: 1 * s,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 2 * s,
            left: 29 * s,
            width: 2.5 * s,
            height: 9 * s,
            backgroundColor: theme.colors.haldi,
            borderRadius: 1 * s,
          }}
        />

        {/* Rounded plump body */}
        <View
          style={{
            position: 'absolute',
            bottom: 9 * s,
            left: 13 * s,
            width: 30 * s,
            height: 22 * s,
            backgroundColor: theme.colors.ink,
            borderTopLeftRadius: 14 * s,
            borderTopRightRadius: 14 * s,
            borderBottomLeftRadius: 12 * s,
            borderBottomRightRadius: 16 * s,
          }}
        />

        {/* Soft belly contour */}
        <View
          style={{
            position: 'absolute',
            bottom: 10 * s,
            left: 22 * s,
            width: 19 * s,
            height: 13 * s,
            backgroundColor: theme.colors.muted,
            opacity: 0.35,
            borderBottomRightRadius: 14 * s,
            borderTopLeftRadius: 8 * s,
          }}
        />

        {/* Neck column & iridescent collar */}
        <View
          style={{
            position: 'absolute',
            top: 13 * s,
            left: 28 * s,
            width: 14 * s,
            height: 15 * s,
            backgroundColor: theme.colors.ink,
            borderRadius: 6 * s,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 19 * s,
            left: 29 * s,
            width: 12 * s,
            height: 4 * s,
            backgroundColor: theme.colors.neem,
            borderRadius: 2 * s,
          }}
        />

        {/* Head */}
        <View
          style={{
            position: 'absolute',
            top: 4 * s,
            left: 29 * s,
            width: 15 * s,
            height: 15 * s,
            backgroundColor: theme.colors.ink,
            borderRadius: 8 * s,
          }}
        />

        {/* Expressive eye + glint */}
        <View
          style={{
            position: 'absolute',
            top: 8 * s,
            left: 37.5 * s,
            width: 4 * s,
            height: 4 * s,
            backgroundColor: theme.colors.background,
            borderRadius: 2 * s,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 1.8 * s,
              height: 1.8 * s,
              backgroundColor: theme.colors.ink,
              borderRadius: 1 * s,
            }}
          />
        </View>

        {/* Golden Beak */}
        <View
          style={{
            position: 'absolute',
            top: 9.5 * s,
            left: 43 * s,
            width: 8 * s,
            height: 4.5 * s,
            backgroundColor: theme.colors.haldi,
            borderTopRightRadius: 3 * s,
            borderBottomRightRadius: 2 * s,
            transform: [{ rotate: '8deg' }],
          }}
        />

        {/* Folded Official Dispatch Letter with Sindoor Wax Seal */}
        <View
          style={{
            position: 'absolute',
            top: 12 * s,
            left: 43 * s,
            width: 14 * s,
            height: 10 * s,
            backgroundColor: theme.colors.card,
            borderWidth: Math.max(1, 1 * s),
            borderColor: theme.colors.rule,
            borderRadius: 2 * s,
            transform: [{ rotate: '12deg' }],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 4.5 * s,
              height: 4.5 * s,
              borderRadius: 2.5 * s,
              backgroundColor: theme.colors.accent,
            }}
          />
        </View>

        {/* Animated Wing */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 19 * s,
            left: 14 * s,
            width: 21 * s,
            height: 12 * s,
            backgroundColor: theme.colors.muted,
            borderTopLeftRadius: 10 * s,
            borderTopRightRadius: 4 * s,
            borderBottomLeftRadius: 4 * s,
            borderBottomRightRadius: 10 * s,
            borderWidth: 1,
            borderColor: theme.colors.ruleSubtle,
            transform: [{ translateY: wingTranslateY }, { rotate: wingRotate }],
          }}
        />
      </Animated.View>
    </View>
  );
}
