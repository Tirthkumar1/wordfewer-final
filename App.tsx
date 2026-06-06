import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { AppNavigator } from './src/navigation/AppNavigator'
import { StorageKeys } from './src/config/storageKeys'
import { GameProvider } from './src/store/gameStore'
import SignInScreen from './src/screens/SignInScreen'
import {
  configureGoogleSignIn,
  getStoredUser,
  signInSilently,
  type GoogleUser,
} from './src/services/AuthService'
import { AuthProvider } from './src/services/AuthContext'
import { registerForPushNotifications } from './src/services/NotificationService'

// Replace with your actual Web Client ID from Google Cloud Console
const WEB_CLIENT_ID = '209043175961-ud150iilnuqgbpsn0pjf42b5f4job27r.apps.googleusercontent.com'

SplashScreen.preventAutoHideAsync()

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Black': require('./assets/fonts/Nunito-Black.ttf'),
    'Nunito-ExtraBold': require('./assets/fonts/Nunito-ExtraBold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('./assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
    'NotoSansGujarati-Bold': require('./assets/fonts/NotoSansGujarati-Bold.ttf'),
    'NotoSansDevanagari-Bold': require('./assets/fonts/NotoSansDevanagari-Bold.ttf'),
  })

  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const signedOutRef = useRef(false)

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  useEffect(() => {
    if (!fontsLoaded && !fontError) return
    configureGoogleSignIn(WEB_CLIENT_ID)
    checkAuth()
  }, [fontsLoaded, fontError])

  async function checkAuth() {
    const joinDate = await AsyncStorage.getItem(StorageKeys.JOIN_DATE)
    if (!joinDate) {
      await AsyncStorage.setItem(StorageKeys.JOIN_DATE, new Date().toISOString())
    }

    // Skip silent sign-in if the user explicitly signed out this session
    if (!signedOutRef.current) {
      const silentUser = await signInSilently()
      if (silentUser) {
        setUser(silentUser)
        setIsGuest(false)
        setAuthChecked(true)
        registerForPushNotifications()
        return
      }
    }

    const stored = await getStoredUser()
    if (stored) {
      setUser(stored)
      setIsGuest(false)
      registerForPushNotifications()
    }
    setAuthChecked(true)
  }

  function handleSignOut() {
    signedOutRef.current = true
    setUser(null)
    setIsGuest(false)
  }

  function handleGuest() {
    setIsGuest(true)
  }

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#13121b' }} />
  }

  if (!authChecked) {
    return <View style={{ flex: 1, backgroundColor: '#13121b' }} />
  }

  if (!user && !isGuest) {
    return (
      <GameProvider>
        <SignInScreen onSignedIn={checkAuth} onSkip={handleGuest} />
      </GameProvider>
    )
  }

  return (
    <GameProvider>
      <AuthProvider onSignOut={handleSignOut} onSignIn={checkAuth}>
        <AppNavigator />
      </AuthProvider>
    </GameProvider>
  )
}
