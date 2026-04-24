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
  },
  android: {
    package: 'com.yourname.wordfever',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#13121b',
    },
  },
  plugins: ['expo-font', 'expo-localization'],
  extra: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
})
