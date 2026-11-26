import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

export function Kabootar({ size = 48, flap = false }) {
  const theme = useTheme();
  const flapAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!flap) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(flapAnim, {
          toValue: -6,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(flapAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [flap, flapAnim]);

  const scale = size / 48;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 40 * scale,
          height: 36 * scale,
          position: 'relative',
        }}
      >
        {/* Pigeon body */}
        <View
          style={{
            position: 'absolute',
            bottom: 4 * scale,
            left: 6 * scale,
            width: 26 * scale,
            height: 18 * scale,
            backgroundColor: theme.colors.ink,
            borderTopLeftRadius: 10 * scale,
            borderBottomRightRadius: 12 * scale,
          }}
        />
        {/* Pigeon head */}
        <View
          style={{
            position: 'absolute',
            top: 2 * scale,
            left: 20 * scale,
            width: 14 * scale,
            height: 14 * scale,
            backgroundColor: theme.colors.ink,
            borderRadius: 7 * scale,
          }}
        />
        {/* Eye */}
        <View
          style={{
            position: 'absolute',
            top: 6 * scale,
            left: 27 * scale,
            width: 3 * scale,
            height: 3 * scale,
            backgroundColor: theme.colors.background,
            borderRadius: 1.5 * scale,
          }}
        />
        {/* Beak with notice paper */}
        <View
          style={{
            position: 'absolute',
            top: 7 * scale,
            left: 33 * scale,
            width: 7 * scale,
            height: 4 * scale,
            backgroundColor: theme.colors.haldi,
            transform: [{ rotate: '15deg' }],
          }}
        />
        {/* Mini notice scroll in beak */}
        <View
          style={{
            position: 'absolute',
            top: 9 * scale,
            left: 31 * scale,
            width: 8 * scale,
            height: 5 * scale,
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.rule,
          }}
        />
        {/* Animated wing */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 10 * scale,
            left: 10 * scale,
            width: 16 * scale,
            height: 10 * scale,
            backgroundColor: theme.colors.muted,
            borderTopLeftRadius: 8 * scale,
            borderBottomRightRadius: 6 * scale,
            transform: [{ translateY: flapAnim }],
          }}
        />
      </View>
    </View>
  );
}
