/**
 * @file Animated messenger-pigeon mascot rendered with native-driver transforms.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, View } from 'react-native';

import { buildKabootarStyles, KabootarBody, KabootarHead } from '@/components/KabootarParts';
import { useTheme } from '@/theme/useTheme';

function useKabootarAnimation(flap) {
  const wingAnim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!flap) return undefined;
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wingAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(wingAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(bobAnim, { toValue: -2, duration: 380, useNativeDriver: true }),
          Animated.timing(bobAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [flap, wingAnim, bobAnim]);

  return { wingAnim, bobAnim };
}

/**
 * Renders the Khabri carrier-pigeon mascot holding a sealed notice.
 *
 * @param {object} props - Component props.
 * @param {number} [props.size=64] - Rendered mascot square dimension in dp.
 * @param {boolean} [props.flap=false] - Enables gentle wing-flap and bob loop when true.
 * @returns {JSX.Element} Animated mascot view.
 */
export function Kabootar({ size = 64, flap = false }) {
  const theme = useTheme();
  const styles = useMemo(() => buildKabootarStyles(theme, size), [theme, size]);
  const { wingAnim, bobAnim } = useKabootarAnimation(flap);

  const bobStyle = useMemo(() => ({ transform: [{ translateY: bobAnim }] }), [bobAnim]);
  const wingStyle = useMemo(() => {
    const s = size / 64;
    const wingTranslateY = wingAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -5 * s] });
    const wingRotate = wingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['-10deg', '14deg'],
    });
    return { transform: [{ translateY: wingTranslateY }, { rotate: wingRotate }] };
  }, [wingAnim, size]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.canvas, bobStyle]}>
        <KabootarBody styles={styles} />
        <KabootarHead styles={styles} />
        <Animated.View style={[styles.wing, wingStyle]} />
      </Animated.View>
    </View>
  );
}
