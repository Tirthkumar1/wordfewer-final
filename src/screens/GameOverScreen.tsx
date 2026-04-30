import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useRef } from 'react'
import {
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import ViewShot from 'react-native-view-shot'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GhostButton from '../components/GhostButton'
import GradientButton from '../components/GradientButton'
import NeuralBackground from '../components/NeuralBackground'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { submitScore } from '../db/dbService'
import { getStoredUser } from '../services/AuthService'
import { showInterstitial } from '../services/AdService'
import { scheduleStreakReminder } from '../services/NotificationService'
import { useGame } from '../store/gameStore'
import { Colors, Fonts, getNativeFont } from '../theme'
import { StorageKeys } from '../config/storageKeys'

const track = (..._args: unknown[]) => {}

type Nav = StackNavigationProp<RootStackParamList>

const LANG_META: Record<string, { flag: string; native: string; script: string }> = {
  en: { flag: '🇬🇧', native: 'English',    script: 'latin' },
  de: { flag: '🇩🇪', native: 'Deutsch',    script: 'latin' },
  gu: { flag: '🇮🇳', native: 'ગુજરાતી',   script: 'gujarati' },
  hi: { flag: '🇮🇳', native: 'हिंदी',      script: 'devanagari' },
  fr: { flag: '🇫🇷', native: 'Français',   script: 'latin' },
  es: { flag: '🇪🇸', native: 'Español',    script: 'latin' },
  it: { flag: '🇮🇹', native: 'Italiano',   script: 'latin' },
  pl: { flag: '🇵🇱', native: 'Polski',     script: 'latin' },
  ro: { flag: '🇷🇴', native: 'Română',     script: 'latin' },
  nl: { flag: '🇳🇱', native: 'Nederlands', script: 'latin' },
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

export default function GameOverScreen() {
  const navigation = useNavigation<Nav>()
  const { state, dispatch } = useGame()
  const shotRef = useRef<ViewShot>(null)
  const insets = useSafeAreaInsets()

  const { chain, score, languageId, sessionStartTime, personalBest } = state
  const chainLength = chain.length
  const timeSurvived = Math.floor((Date.now() - sessionStartTime) / 1000)
  const isPersonalBest = score > personalBest.score || chainLength > personalBest.chain
  const lang = LANG_META[languageId] ?? LANG_META['en']
  const nativeFont = getNativeFont(lang.script)

  useEffect(() => {
    async function onMount() {
      await AsyncStorage.setItem(
        StorageKeys.PERSONAL_BEST,
        JSON.stringify({
          chain: Math.max(chainLength, personalBest.chain),
          score: Math.max(score, personalBest.score),
        }),
      )
      const totalRaw = await AsyncStorage.getItem(StorageKeys.TOTAL_WORDS)
      const total = parseInt(totalRaw ?? '0', 10)
      await AsyncStorage.setItem(StorageKeys.TOTAL_WORDS, String(total + chainLength))

      if (isPersonalBest) {
        const streakRaw = await AsyncStorage.getItem(StorageKeys.STREAK)
        const streak = parseInt(streakRaw ?? '0', 10)
        await AsyncStorage.setItem(StorageKeys.STREAK, String(streak + 1))
      }

      const googleUser = await getStoredUser()
      const username = googleUser?.name ?? (await AsyncStorage.getItem('wordfever_username')) ?? 'Player'
      const userId = googleUser?.id ?? null
      submitScore(userId, username, languageId, state.timerMode, chainLength, score)

      track('game_over', { language: languageId, chain_length: chainLength, score, time_survived: timeSurvived, is_personal_best: isPersonalBest })
      showInterstitial()
      scheduleStreakReminder()
    }
    onMount()
  }, [])

  async function handleShare() {
    try {
      const uri = await shotRef.current?.capture?.()
      if (!uri) return
      await Share.share({ url: uri, message: `I chained ${chainLength} words and scored ${score} pts in WordFever! 🔥` })
    } catch {}
  }

  function handlePlayAgain() {
    dispatch({ type: 'RESET' })
    navigation.replace('Game', {})
  }

  function handleHome() {
    dispatch({ type: 'RESET' })
    navigation.navigate('Tabs')
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <NeuralBackground />

      <View style={styles.inner}>
        {/* Title + PB badge */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.gameOverTitle}>Game Over</Text>
            <Text style={styles.gameOverSub}>You reached word {chainLength}</Text>
          </View>
          {isPersonalBest && (
            <View style={styles.pbBadge}>
              <Text style={styles.pbText}>🏆 PB</Text>
            </View>
          )}
        </View>

        {/* Stats card — doubles as share card */}
        <ViewShot ref={shotRef} options={{ format: 'jpg', quality: 0.95 }} style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={[styles.statsCell, styles.statsCellRight]}>
              <Text style={styles.statsLabel}>LANGUAGE</Text>
              <View style={styles.statsLangRow}>
                <Text style={styles.statsFlag}>{lang.flag}</Text>
                <Text style={[styles.statsLangName, { fontFamily: nativeFont }]}>{lang.native}</Text>
              </View>
            </View>
            <View style={styles.statsCell}>
              <Text style={styles.statsLabel}>TIME</Text>
              <Text style={styles.statsValueBold}>{formatTime(timeSurvived)}</Text>
            </View>
          </View>
          <View style={styles.statsDividerH} />
          <View style={styles.statsRow}>
            <View style={[styles.statsCell, styles.statsCellRight]}>
              <Text style={styles.statsLabel}>MAX CHAIN</Text>
              <Text style={styles.statsChainNum}>{chainLength}</Text>
            </View>
            <View style={styles.statsCell}>
              <Text style={styles.statsLabel}>FINAL SCORE</Text>
              <Text style={styles.statsScoreNum}>{score}</Text>
              <Text style={styles.statsPtsLabel}>PTS</Text>
            </View>
          </View>
        </ViewShot>

        {/* Actions */}
        <GradientButton label="Share Score ↗" onPress={handleShare} style={styles.btn} />
        <GradientButton label="Play Again" onPress={handlePlayAgain} style={styles.btn} />
        <GhostButton label="Back to Home" onPress={handleHome} style={styles.btn} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 14,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameOverTitle: {
    fontFamily: Fonts.gameEB,
    fontSize: 52,
    color: Colors.onSurface,
    letterSpacing: -1,
    lineHeight: 56,
  },
  gameOverSub: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  pbBadge: {
    backgroundColor: Colors.tertiary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pbText: {
    fontFamily: Fonts.headline,
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 1,
  },

  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statsRow: { flexDirection: 'row' },
  statsCell: { flex: 1, padding: 18 },
  statsCellRight: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(72,69,86,0.10)',
  },
  statsDividerH: {
    height: 1,
    backgroundColor: 'rgba(72,69,86,0.10)',
  },
  statsLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statsLangRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsFlag: { fontSize: 18 },
  statsLangName: { fontSize: 15, color: Colors.onSurface },
  statsValueBold: {
    fontFamily: Fonts.headline,
    fontSize: 20,
    color: Colors.onSurface,
  },
  statsChainNum: {
    fontFamily: Fonts.gameEB,
    fontSize: 44,
    color: Colors.primary,
    lineHeight: 48,
  },
  statsScoreNum: {
    fontFamily: Fonts.game,
    fontSize: 36,
    color: '#ffffff',
    lineHeight: 40,
  },
  statsPtsLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  btn: {},
})
