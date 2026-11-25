export default {
  expo: {
    name: 'Khabri',
    slug: 'khabri',
    scheme: 'khabri',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#F4ECDD',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.khabri.app',
    },
    android: {
      package: 'com.khabri.app',
      adaptiveIcon: {
        backgroundColor: '#F4ECDD',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    plugins: ['expo-router', 'expo-font', 'expo-splash-screen', 'expo-localization'],
    experiments: {
      typedRoutes: false,
    },
  },
};
