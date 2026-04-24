import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { View } from 'react-native'
import AppNavigator from './src/navigation/AppNavigator'
import { GameProvider } from './src/store/gameStore'

SplashScreen.preventAutoHideAsync()

export default function App() {
  const [fontsLoaded] = useFonts({
    'Nunito-Black': require('./assets/fonts/Nunito-Black.ttf'),
    'Nunito-ExtraBold': require('./assets/fonts/Nunito-ExtraBold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('./assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
    'NotoSansGujarati-Bold': require('./assets/fonts/NotoSansGujarati-Bold.ttf'),
    'NotoSansDevanagari-Bold': require('./assets/fonts/NotoSansDevanagari-Bold.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#13121b' }} />

  return (
    <GameProvider>
      <AppNavigator />
    </GameProvider>
  )
}
