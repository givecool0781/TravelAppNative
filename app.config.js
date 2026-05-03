module.exports = {
  expo: {
    name: '旅行規劃',
    slug: 'TravelAppNative',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'travelapp',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.travelapp.native',
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
        },
      },
    },
    web: { favicon: './assets/favicon.png' },
    plugins: [
      'expo-router',
      '@react-native-community/datetimepicker',
    ],
    extra: {
      eas: {
        projectId: '4f5dc854-9d64-4dac-84c8-c8e9137b94ec',
      },
    },
  },
}
