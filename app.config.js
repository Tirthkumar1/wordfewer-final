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
    package: 'com.wordfever',
    versionCode: 1,
    googleServicesFile: './android/app/google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#13121b',
    },
  },
  plugins: ['expo-font', 'expo-localization', '@react-native-google-signin/google-signin'],
  extra: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
})
