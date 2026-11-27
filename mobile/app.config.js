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
      intentFilters: [
        {
          action: 'SEND',
          data: [{ mimeType: 'text/plain' }],
          category: ['DEFAULT'],
        },
      ],
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-splash-screen',
      'expo-localization',
      'expo-secure-store',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Khabri uses coarse location once during setup to pre-select your state.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission:
            'Khabri uses the camera to scan printed notices and newspaper clippings.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Khabri lets you choose a notice photo from your library.',
        },
      ],
      [
        'expo-calendar',
        {
          calendarPermission: 'Khabri can add exam and application deadlines to your calendar.',
        },
      ],
      [
        'expo-contacts',
        {
          contactsPermission:
            'Khabri lets you pick contacts to invite to your study or family Circle.',
        },
      ],
      'expo-notifications',
      'expo-share-intent',
    ],
    experiments: {
      typedRoutes: false,
    },
  },
};
