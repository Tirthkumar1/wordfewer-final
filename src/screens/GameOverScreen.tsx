import MaskedView from '@react-native-masked-view/masked-view'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useRef } from 'react'
import {
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import ViewShot from 'react-native-view-shot'
import Svg, { Path } from 'react-native-svg'
import GhostButton from '../components/GhostButton'
import GradientButton from '../components/GradientButton'
import NeuralBackground from '../components/NeuralBackground'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { showInterstitial } from '../services/AdService'
import { track } from '../services/AnalyticsService'
import { submitScore } from '../services/DbService'
import { scheduleStreakReminder } from '../services/NotificationService'
import { useGame } from '../store/gameStore'
import { Colors, Fonts, getNativeFont } from '../theme'

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

function HamburgerIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M3 12h18M3 18h18" stroke={Colors.onSurfaceVariant} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

export default function GameOverScreen() {
  const navigation = useNavigation<Nav>()
  const { state, dispatch } = useGame()
  const shotRef = useRef<ViewShot>(null)

  const { chain, score, languageId, sessionStartTime, personalBest } = state
  const chainLength = chain.length
  const timeSurvived = Math.floor((Date.now() - sessionStartTime) / 1000)
  const isPersonalBest = score > personalBest.score || chainLength > personalBest.chain
  const lang = LANG_META[languageId] ?? LANG_META['en']
  const nativeFont = getNativeFont(lang.script)

  useEffect(() => {
    async function onMount() {
      // Personal best
      if (isPersonalBest) {
        await AsyncStorage.setItem(
          'wordfever_personal_best',
          JSON.stringify({ chain: Math.max(chainLength, personalBest.chain), score: Math.max(score, personalBest.score) }),
        )
        // Bump streak
        const streakRaw = await AsyncStorage.getItem('wordfever_streak')
        const streak = parseInt(streakRaw ?? '0', 10)
        await AsyncStorage.setItem('wordfever_streak', String(streak + 1))
      }

      // DB submit (fire and forget)
      submitScore('Player', languageId, chainLength, score)

      // Analytics
      track('game_over', {
        language: languageId,
        chain_length: chainLength,
        score,
        time_survived: timeSurvived,
        is_personal_best: isPersonalBest,
      })

      // Interstitial every 4th
      showInterstitial()

      // Push reminder
      scheduleStreakReminder()
    }
    onMount()
  }, [])

  async function handleShare() {
    try {
      const uri = await shotRef.current?.capture?.()
      if (!uri) return
      await Share.share({ url: uri, message: `I chained ${chainLength} words and scored ${score} pts in WordFever! Can you beat this? 🔥` })
      track('score_shared', { chain_length: chainLength, score })
    } catch {
      // share cancelled
    }
  }

  function handlePlayAgain() {
    dispatch({ type: 'RESET' })
    navigation.replace('Game', {})
  }

  function handleDaily() {
    navigation.replace('DailyChallenge', {})
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <NeuralBackground />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} hitSlop={8}>
          <HamburgerIcon />
        </Pressable>
        <MaskedView maskElement={<Text style={styles.wordmark}>WordFever</Text>}>
          <LinearGradient colors={['#6C47FF', '#FFB3AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.wordmark, { opacity: 0 }]}>WordFever</Text>
          </LinearGradient>
        </MaskedView>
        <View style={styles.avatar} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.gameOverTitle}>Game Over</Text>
        <Text style={styles.gameOverSub}>Time ran out at word {chainLength}</Text>

        {/* Personal best banner */}
        {isPersonalBest && (
          <View style={styles.pbBanner}>
            <Text style={styles.pbText}>🏆 NEW PERSONAL BEST!</Text>
          </View>
        )}

        {/* Stats card */}
        <View style={styles.statsCard}>
          {/* Top row */}
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

          {/* Divider */}
          <View style={styles.statsDividerH} />

          {/* Bottom row */}
          <View style={styles.statsRow}>
            <View style={[styles.statsCell, styles.statsCellRight]}>
              <Text style={styles.statsLabel}>MAX CHAIN</Text>
              <Text style={styles.statsChainNum}>{chainLength}</Text>
            </View>
            <View style={styles.statsCell}>
              <Text style={styles.statsLabel}>FINAL SCORE</Text>
              <MaskedView maskElement={<Text style={styles.statsScoreNum}>{score}</Text>}>
                <LinearGradient colors={['#ffffff', '#94a3b8']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
                  <Text style={[styles.statsScoreNum, { opacity: 0 }]}>{score}</Text>
                </LinearGradient>
              </MaskedView>
              <Text style={styles.statsPtsLabel}>PTS</Text>
            </View>
          </View>
        </View>

        {/* Share section */}
        <Text style={styles.shareLabel}>SHARE YOUR PROGRESS</Text>

        <ViewShot ref={shotRef} options={{ format: 'jpg', quality: 0.95 }} style={styles.shareCard}>
          {/* Orb decorations */}
          <View style={styles.shareOrbViolet} />
          <View style={styles.shareOrbTeal} />

          <Text style={styles.shareBrand}>WordFever</Text>
          <Text style={styles.shareChain}>{chainLength}</Text>
          <View style={styles.shareDivider} />
          <Text style={styles.shareDetails}>
            WORDS{' '}
            <Text style={styles.shareScore}>{score} pts</Text>
          </Text>
          <Text style={styles.shareCta}>Can you beat this? 👀</Text>
        </ViewShot>

        {/* Buttons */}
        <GradientButton
          label="Share Score ↗"
          onPress={handleShare}
          style={styles.btnSpacing}
        />
        <GhostButton
          label="Play Again"
          onPress={handlePlayAgain}
          style={styles.btnSpacing}
        />
        <Pressable onPress={handleDaily} style={styles.textLink}>
          <Text style={styles.textLinkText}>Try Daily Challenge</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
    marginTop: 80,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 80,
    paddingTop: 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(19,18,27,0.8)',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: Fonts.headlineEB,
    fontSize: 20,
    color: '#6C47FF',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHigh,
  },

  // Title
  gameOverTitle: {
    fontFamily: Fonts.gameEB,
    fontSize: 60,
    color: Colors.onSurface,
    letterSpacing: -1,
    lineHeight: 64,
  },
  gameOverSub: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 18,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    marginBottom: 16,
  },

  // PB banner
  pbBanner: {
    backgroundColor: Colors.tertiary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  pbText: {
    fontFamily: Fonts.headline,
    fontSize: 12,
    color: '#ffffff',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
  },

  // Stats card
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statsCell: {
    flex: 1,
    padding: 20,
  },
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
  statsLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsFlag: {
    fontSize: 20,
  },
  statsLangName: {
    fontSize: 16,
    color: Colors.onSurface,
  },
  statsValueBold: {
    fontFamily: Fonts.headline,
    fontSize: 20,
    color: Colors.onSurface,
  },
  statsChainNum: {
    fontFamily: Fonts.gameEB,
    fontSize: 48,
    color: Colors.primary,
    lineHeight: 52,
  },
  statsScoreNum: {
    fontFamily: Fonts.game,
    fontSize: 40,
    color: '#ffffff',
    lineHeight: 44,
  },
  statsPtsLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: 2,
  },

  // Share
  shareLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 14,
  },
  shareCard: {
    backgroundColor: Colors.surfaceHighest,
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  shareOrbViolet: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(108,71,255,0.25)',
  },
  shareOrbTeal: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(58,223,171,0.15)',
  },
  shareBrand: {
    fontFamily: Fonts.game,
    fontSize: 14,
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  shareChain: {
    fontFamily: Fonts.gameEB,
    fontSize: 72,
    color: Colors.onSurface,
    lineHeight: 76,
  },
  shareDivider: {
    width: 48,
    height: 2,
    backgroundColor: Colors.outlineVariant,
    borderRadius: 1,
    marginVertical: 12,
  },
  shareDetails: {
    fontFamily: Fonts.headline,
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shareScore: {
    color: Colors.primary,
  },
  shareCta: {
    fontFamily: Fonts.body,
    fontStyle: 'italic',
    fontSize: 18,
    color: Colors.onSurfaceVariant,
    marginTop: 12,
  },

  // Bottom buttons
  btnSpacing: {
    marginBottom: 12,
  },
  textLink: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  textLinkText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.primary,
  },
})
