export default ({ config }) => ({
  ...config,
  name: 'WordFever',
  slug: 'wordfever',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#13121b',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.yourname.wordfever',
    infoPlist: {
      GADApplicationIdentifier: process.env.ADMOB_APP_ID_IOS,
    },
  },
  android: {
    package: 'com.yourname.wordfever',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#13121b',
    },
    config: {
      googleMobileAdsAppId: process.env.ADMOB_APP_ID_ANDROID,
    },
  },
  plugins: [
    'expo-font',
    'expo-localization',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#6C47FF',
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: process.env.ADMOB_APP_ID_ANDROID,
        iosAppId: process.env.ADMOB_APP_ID_IOS,
      },
    ],
    '@sentry/react-native/expo',
  ],
  extra: {
    DATABASE_URL: process.env.DATABASE_URL,
    REVENUECAT_KEY_IOS: process.env.REVENUECAT_KEY_IOS,
    REVENUECAT_KEY_ANDROID: process.env.REVENUECAT_KEY_ANDROID,
    SENTRY_DSN: process.env.SENTRY_DSN,
    POSTHOG_KEY: process.env.POSTHOG_KEY,
    eas: { projectId: 'REPLACE_WITH_EAS_PROJECT_ID' },
  },
})
