import AsyncStorage from '@react-native-async-storage/async-storage'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'

export interface GoogleUser {
  id: string
  name: string
  email: string
  photo: string | null
}

const STORAGE_KEY = 'wordfewer_google_user'

export function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({ webClientId, offlineAccess: false })
}

export async function getStoredUser(): Promise<GoogleUser | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
}

async function storeUser(user: GoogleUser) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  // Keep username key in sync so leaderboard & game over use Google name
  await AsyncStorage.setItem('wordfever_username', user.name)
}

export async function signInSilently(): Promise<GoogleUser | null> {
  try {
    await GoogleSignin.hasPlayServices()
    const userInfo = await GoogleSignin.signInSilently()
    const user: GoogleUser = {
      id: userInfo.data?.user.id ?? '',
      name: userInfo.data?.user.name ?? 'Player',
      email: userInfo.data?.user.email ?? '',
      photo: userInfo.data?.user.photo ?? null,
    }
    await storeUser(user)
    return user
  } catch {
    return null
  }
}

export async function signIn(): Promise<GoogleUser | null> {
  try {
    await GoogleSignin.hasPlayServices()
    const userInfo = await GoogleSignin.signIn()
    const user: GoogleUser = {
      id: userInfo.data?.user.id ?? '',
      name: userInfo.data?.user.name ?? 'Player',
      email: userInfo.data?.user.email ?? '',
      photo: userInfo.data?.user.photo ?? null,
    }
    await storeUser(user)
    return user
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) return null
    throw error
  }
}

export async function signOut(): Promise<void> {
  try {
    await GoogleSignin.signOut()
  } catch {}
  await AsyncStorage.removeItem(STORAGE_KEY)
  await AsyncStorage.removeItem('wordfever_username')
}
