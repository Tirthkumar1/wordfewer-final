import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import NeuralBackground from '../components/NeuralBackground'
import { StorageKeys } from '../config/storageKeys'
import { signIn, type GoogleUser } from '../services/AuthService'
import { Colors, Fonts } from '../theme'

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  )
}

type Props = {
  onComplete: (name: string, googleUser?: GoogleUser) => void
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState<'google' | 'guest' | null>(null)
  const [error, setError] = useState('')

  async function handleGoogle() {
    setError('')
    setLoading('google')
    try {
      const user = await signIn()
      if (user) {
        const displayName = user.name || name.trim() || 'Player'
        await AsyncStorage.setItem(StorageKeys.USERNAME, displayName)
        onComplete(displayName, user)
      } else {
        setError('Sign-in cancelled.')
      }
    } catch (e: any) {
      const code = e?.code ?? ''
      if (code === '10' || String(code).includes('10')) {
        setError('Google sign-in not set up yet. Please play as Guest for now.')
      } else {
        setError(`Sign-in failed (${code || e?.message || 'unknown'}). Try Guest mode.`)
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleGuest() {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Please enter at least 2 characters for your name.')
      return
    }
    setLoading('guest')
    await AsyncStorage.setItem(StorageKeys.USERNAME, trimmed)
    onComplete(trimmed)
    setLoading(null)
  }

  const nameOk = name.trim().length >= 2

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <NeuralBackground />
      <View style={styles.orbViolet} />
      <View style={styles.orbCoral} />

      <View style={styles.content}>
        {/* Wordmark */}
        <Text style={styles.wordmark}>WordFever</Text>
        <Text style={styles.tagline}>Chain words. Beat everyone.</Text>

        {/* Name card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What's your name?</Text>
          <Text style={styles.cardSub}>
            This name will appear on the leaderboard. You can change it later.
          </Text>

          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={t => { setName(t); setError('') }}
            placeholder="Enter your name…"
            placeholderTextColor={Colors.outlineVariant}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={20}
            returnKeyType="done"
          />

          {/* Google sign-in */}
          <Pressable
            style={[styles.googleBtn, loading === 'google' && styles.btnDisabled]}
            onPress={handleGoogle}
            disabled={loading !== null}
          >
            {loading === 'google' ? (
              <ActivityIndicator color="#1a1a1a" size="small" />
            ) : (
              <>
                <GoogleLogo />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest button */}
          <Pressable
            style={[styles.guestBtn, (!nameOk || loading === 'guest') && styles.guestBtnDisabled]}
            onPress={handleGuest}
            disabled={!nameOk || loading !== null}
          >
            {loading === 'guest' ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Text style={[styles.guestBtnText, !nameOk && styles.guestBtnTextDisabled]}>
                Play as Guest
              </Text>
            )}
          </Pressable>

          {!nameOk && name.length === 0 && (
            <Text style={styles.hintText}>Type your name above to continue as guest</Text>
          )}

          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <Text style={styles.privacyNote}>
          Guest mode uses only your chosen name — no account needed.
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  orbViolet: {
    position: 'absolute', top: '15%', left: '5%',
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(108,71,255,0.18)',
  },
  orbCoral: {
    position: 'absolute', bottom: '15%', right: '5%',
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(146,4,24,0.10)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  wordmark: {
    fontFamily: Fonts.headlineEB,
    fontSize: 42,
    color: Colors.primaryContainer,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    marginBottom: 8,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    gap: 14,
  },
  cardTitle: {
    fontFamily: Fonts.headlineEB,
    fontSize: 20,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  cardSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  nameInput: {
    backgroundColor: Colors.surfaceLow,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 18,
    fontFamily: Fonts.bodyMedium,
    fontSize: 17,
    color: Colors.onSurface,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  btnDisabled: { opacity: 0.55 },
  googleBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: '#1a1a1a',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: Colors.outlineVariant, opacity: 0.3,
  },
  dividerText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  guestBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(201,190,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,190,255,0.25)',
  },
  guestBtnDisabled: { opacity: 0.45 },
  guestBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.primary,
  },
  guestBtnTextDisabled: { color: Colors.onSurfaceVariant },
  hintText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: -6,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.secondary,
    textAlign: 'center',
  },
  privacyNote: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.7,
  },
})
