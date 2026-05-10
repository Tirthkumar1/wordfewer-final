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
    bundleIdentifier: 'com.wordfever',
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
  plugins: [
    'expo-font',
    'expo-localization',
    '@react-native-google-signin/google-signin',
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-6945189356120937~6355323266',
        iosAppId: 'ca-app-pub-6945189356120937~6355323266',
      },
    ],
  ],
  extra: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
})
