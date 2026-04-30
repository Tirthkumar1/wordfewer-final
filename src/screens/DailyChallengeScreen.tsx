import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import GhostButton from '../components/GhostButton'
import GradientButton from '../components/GradientButton'
import NeuralBackground from '../components/NeuralBackground'
import type { RootStackParamList } from '../navigation/AppNavigator'
import {
  getDailyChallenge,
  getLeaderboard,
  getTodayDailyResult,
  type LeaderboardEntry,
} from '../db/dbService'
import { useGame, TIMER_OPTIONS } from '../store/gameStore'
import { Colors, Fonts } from '../theme'

type Nav = StackNavigationProp<RootStackParamList>

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: Colors.tertiary,
  medium: Colors.amber,
  hard: Colors.secondary,
}

const MEDAL = ['🥇', '🥈', '🥉']

function CountdownTimer() {
  const [secs, setSecs] = useState(() => {
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    return Math.floor((midnight.getTime() - now.getTime()) / 1000)
  })

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <Text style={styles.countdown}>{pad(h)}:{pad(m)}:{pad(s)}</Text>
  )
}

export default function DailyChallengeScreen() {
  const navigation = useNavigation<Nav>()
  const { state } = useGame()

  const [challenge, setChallenge] = useState<{ startingWord: string; difficulty: string } | null>(null)
  const [todayResult, setTodayResult] = useState<{ chainLength: number | null; score: number | null } | null>(null)
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [state.languageId])

  async function load() {
    setLoading(true)
    const [ch, result, scores] = await Promise.all([
      getDailyChallenge(state.languageId),
      getTodayDailyResult(state.languageId),
      getLeaderboard(state.languageId, 'today', state.timerMode, 3),
    ])
    setChallenge(ch ? { startingWord: ch.startingWord, difficulty: ch.difficulty ?? 'medium' } : null)
    setTodayResult(result ? { chainLength: result.chainLength, score: result.score } : null)
    setTopScores(scores)
    setLoading(false)
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const alreadyPlayed = todayResult !== null

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <NeuralBackground />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>WordFever</Text>
        <Text style={styles.dateLabel}>{today}</Text>
      </View>

      {/* Countdown */}
      <View style={styles.countdownRow}>
        <Text style={styles.countdownLabel}>Next challenge in</Text>
        <CountdownTimer />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : !challenge ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No challenge today</Text>
          <Text style={styles.emptySubtext}>Check back soon!</Text>
        </View>
      ) : (
        <View style={styles.body}>
          {/* Challenge card */}
          <View style={styles.challengeCard}>
            {/* Glow behind word */}
            <View style={styles.wordGlow} />
            <View style={styles.wordCircle}>
              <Text style={styles.startingWord}>{challenge.startingWord}</Text>
            </View>
            <View style={styles.difficultyRow}>
              <View style={[styles.difficultyBadge, { backgroundColor: DIFFICULTY_COLOR[challenge.difficulty] + '33' }]}>
                <Text style={[styles.difficultyText, { color: DIFFICULTY_COLOR[challenge.difficulty] }]}>
                  {challenge.difficulty.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.startingLabel}>Starting Word</Text>
            </View>
          </View>

          {/* Mini leaderboard */}
          {topScores.length > 0 && (
            <View style={styles.miniLeaderboard}>
              <Text style={styles.miniLeaderboardLabel}>TODAY'S TOP PLAYERS</Text>
              {topScores.map((entry, i) => (
                <View key={i} style={styles.miniRow}>
                  <Text style={styles.miniMedal}>{MEDAL[i]}</Text>
                  <Text style={styles.miniName}>{entry.username}</Text>
                  <Text style={styles.miniScore}>{entry.score} pts</Text>
                </View>
              ))}
            </View>
          )}

          {/* Already played result */}
          {alreadyPlayed && todayResult && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>YOUR RESULT TODAY</Text>
              <View style={styles.resultRow}>
                <View style={styles.resultStat}>
                  <Text style={styles.resultValue}>{todayResult.chainLength ?? 0}</Text>
                  <Text style={styles.resultKey}>WORDS</Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultStat}>
                  <Text style={styles.resultValue}>{todayResult.score ?? 0}</Text>
                  <Text style={styles.resultKey}>PTS</Text>
                </View>
              </View>
            </View>
          )}

          {/* CTA */}
          {!alreadyPlayed ? (
            <GradientButton
              label="Start Today's Challenge"
              onPress={() =>
                navigation.navigate('Game', {
                  isDailyChallenge: true,
                  startingWord: challenge.startingWord,
                })
              }
              style={styles.cta}
            />
          ) : (
            <GhostButton
              label="See Leaderboard"
              onPress={() => navigation.navigate('Tabs')}
              style={styles.cta}
            />
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(19,18,27,0.9)',
    alignItems: 'center',
    gap: 4,
  },
  wordmark: { fontFamily: Fonts.headlineEB, fontSize: 20, color: '#6C47FF' },
  dateLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant },

  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceLowest,
  },
  countdownLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant },
  countdown: { fontFamily: Fonts.game, fontSize: 18, color: Colors.primary },

  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 16 },

  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  wordGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(108,71,255,0.15)',
  },
  wordCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: Colors.primaryContainer,
    backgroundColor: Colors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startingWord: { fontFamily: Fonts.game, fontSize: 32, color: Colors.primary, textAlign: 'center' },
  difficultyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  difficultyBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  difficultyText: { fontFamily: Fonts.bodyMedium, fontSize: 11, letterSpacing: 1 },
  startingLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant },

  miniLeaderboard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  miniLeaderboardLabel: {
    fontFamily: Fonts.body, fontSize: 10,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: 4,
  },
  miniRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  miniMedal: { fontSize: 18, width: 24 },
  miniName: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurface, flex: 1 },
  miniScore: { fontFamily: Fonts.game, fontSize: 14, color: Colors.primary },

  resultCard: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  resultLabel: {
    fontFamily: Fonts.body, fontSize: 10,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  resultStat: { alignItems: 'center', gap: 4 },
  resultValue: { fontFamily: Fonts.game, fontSize: 36, color: Colors.primary },
  resultKey: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant, letterSpacing: 1.5 },
  resultDivider: { width: 1, height: 40, backgroundColor: Colors.outlineVariant },

  cta: { marginTop: 4 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface },
  emptySubtext: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },
})
