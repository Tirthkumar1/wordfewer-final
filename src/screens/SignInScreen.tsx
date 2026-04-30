import React, { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import NeuralBackground from '../components/NeuralBackground'
import { signIn } from '../services/AuthService'
import { Colors, Fonts } from '../theme'

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  )
}

type Props = {
  onSignedIn: () => void
}

export default function SignInScreen({ onSignedIn }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn() {
    setLoading(true)
    setError('')
    try {
      const user = await signIn()
      if (user) onSignedIn()
      else setError('Sign-in cancelled.')
    } catch {
      setError('Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <NeuralBackground />

      <View style={styles.orbViolet} />
      <View style={styles.orbCoral} />

      <View style={styles.content}>
        <Text style={styles.wordmark}>WordFever</Text>
        <Text style={styles.tagline}>Chain words. Beat friends.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to play</Text>
          <Text style={styles.cardSub}>
            Your scores go to the global leaderboard.{'\n'}No password needed.
          </Text>

          <Pressable
            style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <>
                <GoogleLogo />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  orbViolet: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(108,71,255,0.20)',
  },
  orbCoral: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(146,4,24,0.10)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  wordmark: {
    fontFamily: Fonts.headlineEB,
    fontSize: 40,
    color: Colors.primaryContainer,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    marginBottom: 48,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontFamily: Fonts.headlineEB,
    fontSize: 20,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  cardSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
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
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: '#1a1a1a',
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.secondary,
    textAlign: 'center',
  },
})
