import MaskedView from '@react-native-masked-view/masked-view'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import GhostButton from '../components/GhostButton'
import GradientButton from '../components/GradientButton'
import { StorageKeys } from '../config/storageKeys'
import { useGame } from '../store/gameStore'
import { Colors, Fonts } from '../theme'

interface Stats {
  bestChain: number
  bestScore: number
  totalWords: number
  streak: number
  joinDate: string
}

interface Achievement {
  id: string
  label: string
  description: string
  icon: string
  earned: boolean
}

const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧', de: '🇩🇪', gu: '🇮🇳', hi: '🇮🇳',
  fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹', pl: '🇵🇱', ro: '🇷🇴', nl: '🇳🇱',
}

function VerifiedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={Colors.primaryContainer} />
      <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <View style={[styles.badge, !achievement.earned && styles.badgeLocked]}>
      <Text style={styles.badgeIcon}>{achievement.icon}</Text>
      <Text style={[styles.badgeLabel, !achievement.earned && styles.badgeLabelLocked]}>
        {achievement.label}
      </Text>
      <Text style={styles.badgeDesc}>{achievement.description}</Text>
    </View>
  )
}

export default function ProfileScreen() {
  const { state } = useGame()
  const [stats, setStats] = useState<Stats>({
    bestChain: 0, bestScore: 0, totalWords: 0, streak: 0, joinDate: '',
  })

  useEffect(() => {
    async function load() {
      const [pb, streak, total, join] = await Promise.all([
        AsyncStorage.getItem(StorageKeys.PERSONAL_BEST),
        AsyncStorage.getItem(StorageKeys.STREAK),
        AsyncStorage.getItem(StorageKeys.TOTAL_WORDS),
        AsyncStorage.getItem(StorageKeys.JOIN_DATE),
      ])

      const today = new Date().toISOString().split('T')[0]
      if (!join) await AsyncStorage.setItem(StorageKeys.JOIN_DATE, today)

      const pbParsed = pb ? JSON.parse(pb) : { chain: 0, score: 0 }
      setStats({
        bestChain: pbParsed.chain ?? 0,
        bestScore: pbParsed.score ?? 0,
        totalWords: parseInt(total ?? '0', 10),
        streak: parseInt(streak ?? '0', 10),
        joinDate: join ?? today,
      })
    }
    load()
  }, [])

  const username = 'Player'
  const joinFormatted = stats.joinDate
    ? new Date(stats.joinDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : '—'

  const achievements: Achievement[] = [
    { id: 'chain_master', label: 'Chain Master', description: '50+ word chain', icon: '🔗', earned: stats.bestChain >= 50 },
    { id: 'polyglot', label: 'Polyglot', description: 'Play 3 languages', icon: '🌍', earned: false },
    { id: 'daily_devotee', label: 'Daily Devotee', description: '7-day streak', icon: '🔥', earned: stats.streak >= 7 },
    { id: 'rare_hunter', label: 'Rare Hunter', description: 'Use Q, X or Z', icon: '⭐', earned: stats.totalWords > 10 },
    { id: 'high_scorer', label: 'High Scorer', description: 'Score 1000+ pts', icon: '🏆', earned: stats.bestScore >= 1000 },
  ]

  async function handleShareProfile() {
    try {
      await Share.share({
        message: `I've chained ${stats.bestChain} words and scored ${stats.bestScore} pts on WordFever! Can you beat me?`,
      })
    } catch {}
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Gradient top strip */}
        <LinearGradient colors={['#6C47FF22', '#13121b']} style={styles.topStrip} />

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={['#6C47FF', '#FFB3AF']}
            style={styles.avatarGradientRing}
          >
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitial}>{username[0].toUpperCase()}</Text>
            </View>
          </LinearGradient>
          <View style={styles.verifiedRow}>
            <Text style={styles.username}>{username}</Text>
            <VerifiedIcon />
          </View>
          <Text style={styles.joinDate}>Playing since {joinFormatted}</Text>
          <View style={styles.langPill}>
            <Text style={styles.langPillText}>
              {LANG_FLAGS[state.languageId] ?? '🌍'}  {state.languageId.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatBox label="BEST CHAIN" value={stats.bestChain} />
          <StatBox label="BEST SCORE" value={stats.bestScore} />
          <StatBox label="TOTAL WORDS" value={stats.totalWords} />
          <StatBox label="DAY STREAK" value={`${stats.streak}🔥`} />
        </View>

        {/* Achievements */}
        <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.achievementsRow}
        >
          {achievements.map((a) => (
            <AchievementBadge key={a.id} achievement={a} />
          ))}
        </ScrollView>

        {/* Active languages */}
        <Text style={styles.sectionLabel}>ACTIVE LANGUAGES</Text>
        <View style={styles.langRow}>
          {['en', 'de', 'gu', 'hi'].map((l) => (
            <View key={l} style={[styles.langChip, state.languageId === l && styles.langChipActive]}>
              <Text style={styles.langChipText}>{LANG_FLAGS[l]} {l.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <GradientButton
          label="Remove Ads 👑"
          onPress={() => console.log('IAP stub: remove ads')}
          style={styles.btn}
        />
        <GhostButton
          label="Share Profile"
          onPress={handleShareProfile}
          style={styles.btn}
        />

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },

  topStrip: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },

  avatarSection: { alignItems: 'center', paddingTop: 64, paddingBottom: 24, gap: 6 },
  avatarGradientRing: {
    width: 100, height: 100, borderRadius: 50,
    padding: 3, marginBottom: 4,
  },
  avatarInner: {
    flex: 1, borderRadius: 47,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: Fonts.headlineEB, fontSize: 36, color: Colors.primary },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  username: { fontFamily: Fonts.headlineEB, fontSize: 22, color: Colors.onSurface },
  joinDate: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant },
  langPill: {
    backgroundColor: Colors.surfaceHigh, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 4,
  },
  langPillText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurface },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28,
  },
  statBox: {
    flex: 1, minWidth: '44%',
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 4,
  },
  statValue: { fontFamily: Fonts.game, fontSize: 28, color: Colors.primary },
  statLabel: {
    fontFamily: Fonts.body, fontSize: 10,
    color: Colors.onSurfaceVariant, letterSpacing: 1.2, textTransform: 'uppercase',
  },

  sectionLabel: {
    fontFamily: Fonts.body, fontSize: 10,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: 12,
  },

  achievementsRow: { paddingRight: 20, gap: 12, marginBottom: 28 },
  badge: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 4, width: 100,
  },
  badgeLocked: { opacity: 0.4 },
  badgeIcon: { fontSize: 28 },
  badgeLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurface, textAlign: 'center' },
  badgeLabelLocked: { color: Colors.onSurfaceVariant },
  badgeDesc: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant, textAlign: 'center' },

  langRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 28 },
  langChip: {
    backgroundColor: Colors.surface, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  langChipActive: { backgroundColor: Colors.primaryContainer },
  langChipText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onSurface },

  btn: { marginBottom: 12 },
})
