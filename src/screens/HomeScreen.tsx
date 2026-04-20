import MaskedView from '@react-native-masked-view/masked-view'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg'
import GradientButton from '../components/GradientButton'
import GhostButton from '../components/GhostButton'
import NeuralBackground from '../components/NeuralBackground'
import { useGame } from '../store/gameStore'
import { Colors, Fonts } from '../theme'
import type { RootStackParamList } from '../navigation/AppNavigator'

type Nav = StackNavigationProp<RootStackParamList>

// ─── Gradient text helper ─────────────────────────────────────────────────────

function GradientText({
  text,
  style,
}: {
  text: string
  style?: object
}) {
  return (
    <MaskedView
      maskElement={<Text style={[style, { backgroundColor: 'transparent' }]}>{text}</Text>}
    >
      <LinearGradient colors={['#6C47FF', '#FFB3AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  )
}

// ─── Lightning bolt SVG ───────────────────────────────────────────────────────

function LightningBolt() {
  return (
    <Svg width={32} height={48} viewBox="0 0 32 48">
      <Defs>
        <SvgGradient id="bolt" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6C47FF" />
          <Stop offset="1" stopColor="#FFB3AF" />
        </SvgGradient>
      </Defs>
      <Path d="M20 2L4 28h12l-4 18L28 20H16L20 2z" fill="url(#bolt)" />
    </Svg>
  )
}

// ─── Stats card ───────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string
  value: string | number
  borderColor: string
  icon: React.ReactNode
}

function StatCard({ label, value, borderColor, icon }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: borderColor }]}>
      <View style={styles.statRow}>
        {icon}
        <View style={styles.statText}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      </View>
    </View>
  )
}

function LinkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={Colors.primaryContainer} strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={Colors.primaryContainer} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function StarIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={Colors.tertiary} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  )
}

function FireIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2c0 6-6 8-6 14a6 6 0 0012 0c0-6-6-8-6-14z" stroke={Colors.secondary} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const { state } = useGame()
  const [personalBest, setPersonalBest] = useState({ chain: 0, score: 0 })
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    async function load() {
      const [pbRaw, streakRaw] = await Promise.all([
        AsyncStorage.getItem('wordfever_personal_best'),
        AsyncStorage.getItem('wordfever_streak'),
      ])
      if (pbRaw) setPersonalBest(JSON.parse(pbRaw))
      if (streakRaw) setStreak(parseInt(streakRaw, 10))
    }
    load()
  }, [])

  const langPack = state.languageId
  const wordOfDay = 'APPLE'

  const langMeta: Record<string, { flag: string; native: string }> = {
    en: { flag: '🇬🇧', native: 'English' },
    de: { flag: '🇩🇪', native: 'Deutsch' },
    gu: { flag: '🇮🇳', native: 'ગુજરાતી' },
    hi: { flag: '🇮🇳', native: 'हिंदी' },
  }
  const lang = langMeta[langPack] ?? langMeta['en']

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <NeuralBackground />

      {/* Decorative orbs */}
      <View style={styles.orbViolet} />
      <View style={styles.orbCoral} />

      {/* Fixed header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} hitSlop={8}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M3 6h18M3 12h18M3 18h18" stroke={Colors.onSurfaceVariant} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>

        <MaskedView
          maskElement={
            <Text style={styles.wordmark}>WordFever</Text>
          }
        >
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
        {/* Hero wordmark */}
        <View style={styles.heroRow}>
          <MaskedView
            maskElement={<Text style={styles.heroWord}>Word</Text>}
          >
            <LinearGradient colors={['#6C47FF', '#FFB3AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.heroWord, { opacity: 0 }]}>Word</Text>
            </LinearGradient>
          </MaskedView>
          <LightningBolt />
          <MaskedView
            maskElement={<Text style={styles.heroWord}>Fever</Text>}
          >
            <LinearGradient colors={['#6C47FF', '#FFB3AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.heroWord, { opacity: 0 }]}>Fever</Text>
            </LinearGradient>
          </MaskedView>
        </View>

        {/* Language pill */}
        <Pressable
          style={styles.langPill}
          onPress={() => navigation.navigate('LanguagePicker')}
        >
          <Text style={styles.langPillText}>{lang.flag}  {lang.native}</Text>
        </Pressable>

        {/* Stats */}
        <View style={styles.statsBlock}>
          <StatCard
            label="BEST CHAIN"
            value={personalBest.chain}
            borderColor={Colors.primaryContainer}
            icon={<LinkIcon />}
          />
          <StatCard
            label="TOP SCORE"
            value={personalBest.score}
            borderColor={Colors.tertiary}
            icon={<StarIcon />}
          />
          <StatCard
            label="STREAK"
            value={`${streak} days`}
            borderColor={Colors.secondary}
            icon={<FireIcon />}
          />
        </View>

        {/* CTA buttons */}
        <GradientButton
          label="Start Playing"
          onPress={() => navigation.navigate('Game', {})}
          style={styles.btnSpacing}
        />
        <GhostButton
          label="Daily Challenge"
          onPress={() => navigation.navigate('DailyChallenge', {})}
          style={styles.btnSpacing}
        />

        {/* Word of the day */}
        <View style={styles.wotdBlock}>
          <Text style={styles.wotdLabel}>WORD OF THE DAY</Text>
          <MaskedView
            maskElement={<Text style={styles.wotdWord}>{wordOfDay}</Text>}
          >
            <LinearGradient colors={['#6C47FF', '#FFB3AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.wotdWord, { opacity: 0 }]}>{wordOfDay}</Text>
            </LinearGradient>
          </MaskedView>
        </View>

        {/* Bottom tab bar clearance */}
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

  // Orbs
  orbViolet: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(108,71,255,0.20)',
    // blur approximation — use pointerEvents none
  },
  orbCoral: {
    position: 'absolute',
    bottom: '25%',
    right: '25%',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(146,4,24,0.10)',
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

  // Hero
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  heroWord: {
    fontFamily: Fonts.game,
    fontSize: 64,
    color: '#6C47FF',
    lineHeight: 72,
  },

  // Language pill
  langPill: {
    alignSelf: 'center',
    backgroundColor: Colors.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 32,
  },
  langPillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.onSurface,
  },

  // Stats
  statsBlock: {
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderLeftWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statText: {
    flex: 1,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: Fonts.game,
    fontSize: 18,
    color: Colors.onSurface,
    marginTop: 2,
  },

  // Buttons
  btnSpacing: {
    marginBottom: 12,
  },

  // Word of the day
  wotdBlock: {
    alignItems: 'center',
    marginTop: 16,
  },
  wotdLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  wotdWord: {
    fontFamily: Fonts.game,
    fontSize: 24,
    fontStyle: 'italic',
    color: '#6C47FF',
  },
})
