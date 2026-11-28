/**
 * @file Scaled geometry styles and sub-views composing the Kabootar pigeon illustration.
 */
import { StyleSheet, View } from 'react-native';

/**
 * Builds proportional pigeon part styles scaled from a 64dp baseline canvas.
 *
 * @param {object} theme - Active design theme tokens.
 * @param {number} size - Target mascot square dimension in dp.
 * @returns {object} StyleSheet object keyed by body part.
 */
export function buildKabootarStyles(theme, size) {
  const s = size / 64;
  return StyleSheet.create({
    wrapper: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    canvas: {
      width: 60 * s,
      height: 54 * s,
      position: 'relative',
    },
    tailTop: {
      position: 'absolute',
      bottom: 13 * s,
      left: 2 * s,
      width: 18 * s,
      height: 7 * s,
      backgroundColor: theme.colors.muted,
      borderTopLeftRadius: 6 * s,
      borderBottomLeftRadius: 2 * s,
      transform: [{ rotate: '-28deg' }],
    },
    tailBottom: {
      position: 'absolute',
      bottom: 9 * s,
      left: 4 * s,
      width: 15 * s,
      height: 6 * s,
      backgroundColor: theme.colors.ink,
      borderTopLeftRadius: 5 * s,
      borderBottomLeftRadius: 2 * s,
      transform: [{ rotate: '-12deg' }],
    },
    legLeft: {
      position: 'absolute',
      bottom: 2 * s,
      left: 23 * s,
      width: 2.5 * s,
      height: 9 * s,
      backgroundColor: theme.colors.haldi,
      borderRadius: 1 * s,
    },
    legRight: {
      position: 'absolute',
      bottom: 2 * s,
      left: 29 * s,
      width: 2.5 * s,
      height: 9 * s,
      backgroundColor: theme.colors.haldi,
      borderRadius: 1 * s,
    },
    body: {
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
    },
    belly: {
      position: 'absolute',
      bottom: 10 * s,
      left: 22 * s,
      width: 19 * s,
      height: 13 * s,
      backgroundColor: theme.colors.muted,
      opacity: 0.35,
      borderBottomRightRadius: 14 * s,
      borderTopLeftRadius: 8 * s,
    },
    neck: {
      position: 'absolute',
      top: 13 * s,
      left: 28 * s,
      width: 14 * s,
      height: 15 * s,
      backgroundColor: theme.colors.ink,
      borderRadius: 6 * s,
    },
    collar: {
      position: 'absolute',
      top: 19 * s,
      left: 29 * s,
      width: 12 * s,
      height: 4 * s,
      backgroundColor: theme.colors.neem,
      borderRadius: 2 * s,
    },
    head: {
      position: 'absolute',
      top: 4 * s,
      left: 29 * s,
      width: 15 * s,
      height: 15 * s,
      backgroundColor: theme.colors.ink,
      borderRadius: 8 * s,
    },
    eye: {
      position: 'absolute',
      top: 8 * s,
      left: 37.5 * s,
      width: 4 * s,
      height: 4 * s,
      backgroundColor: theme.colors.background,
      borderRadius: 2 * s,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eyeGlint: {
      width: 1.8 * s,
      height: 1.8 * s,
      backgroundColor: theme.colors.ink,
      borderRadius: 1 * s,
    },
    beak: {
      position: 'absolute',
      top: 9.5 * s,
      left: 43 * s,
      width: 8 * s,
      height: 4.5 * s,
      backgroundColor: theme.colors.haldi,
      borderTopRightRadius: 3 * s,
      borderBottomRightRadius: 2 * s,
      transform: [{ rotate: '8deg' }],
    },
    letter: {
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
    },
    seal: {
      width: 4.5 * s,
      height: 4.5 * s,
      borderRadius: 2.5 * s,
      backgroundColor: theme.colors.accent,
    },
    wing: {
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
    },
  });
}

/**
 * Renders the pigeon tail, legs, torso, belly, neck, and collar layers.
 *
 * @param {object} props - Component props.
 * @param {object} props.styles - Scaled styles from {@link buildKabootarStyles}.
 * @returns {JSX.Element} Mascot body fragment.
 */
export function KabootarBody({ styles }) {
  return (
    <>
      <View style={styles.tailTop} />
      <View style={styles.tailBottom} />
      <View style={styles.legLeft} />
      <View style={styles.legRight} />
      <View style={styles.body} />
      <View style={styles.belly} />
      <View style={styles.neck} />
      <View style={styles.collar} />
    </>
  );
}

/**
 * Renders the pigeon head, eye glint, beak, and sealed letter layers.
 *
 * @param {object} props - Component props.
 * @param {object} props.styles - Scaled styles from {@link buildKabootarStyles}.
 * @returns {JSX.Element} Mascot head fragment.
 */
export function KabootarHead({ styles }) {
  return (
    <>
      <View style={styles.head} />
      <View style={styles.eye}>
        <View style={styles.eyeGlint} />
      </View>
      <View style={styles.beak} />
      <View style={styles.letter}>
        <View style={styles.seal} />
      </View>
    </>
  );
}
