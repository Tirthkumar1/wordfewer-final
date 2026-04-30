import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads'
import GradientButton from '../components/GradientButton'
import GhostButton from '../components/GhostButton'
import NeuralBackground from '../components/NeuralBackground'
import { useGame, TIMER_OPTIONS, type TimerMode } from '../store/gameStore'
import { Colors, Fonts } from '../theme'
import type { RootStackParamList } from '../navigation/AppNavigator'

const BANNER_ID = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-6945189356120937/3873238966'

type Nav = StackNavigationProp<RootStackParamList>

function LinkIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={Colors.primaryContainer} strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={Colors.primaryContainer} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function StarIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={Colors.tertiary} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  )
}

function FireIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2c0 6-6 8-6 14a6 6 0 0012 0c0-6-6-8-6-14z" stroke={Colors.secondary} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  )
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const { state, dispatch } = useGame()
  const insets = useSafeAreaInsets()
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

  const langMeta: Record<string, { flag: string; native: string }> = {
    en: { flag: '🇬🇧', native: 'English' },
    de: { flag: '🇩🇪', native: 'Deutsch' },
    gu: { flag: '🇮🇳', native: 'ગુજરાતી' },
    hi: { flag: '🇮🇳', native: 'हिंदी' },
  }
  const lang = langMeta[state.languageId] ?? langMeta['en']

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <NeuralBackground />
      <View style={styles.orbViolet} />
      <View style={styles.orbCoral} />

      <View style={styles.content}>
        {/* Wordmark */}
        <Text style={styles.wordmark}>WordFever</Text>

        {/* Language pill */}
        <Pressable style={styles.langPill} onPress={() => navigation.navigate('LanguagePicker')}>
          <Text style={styles.langPillText}>{lang.flag}  {lang.native}</Text>
        </Pressable>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: Colors.primaryContainer }]}>
            <LinkIcon />
            <Text style={styles.statValue}>{personalBest.chain}</Text>
            <Text style={styles.statLabel}>BEST CHAIN</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.tertiary }]}>
            <StarIcon />
            <Text style={styles.statValue}>{personalBest.score}</Text>
            <Text style={styles.statLabel}>TOP SCORE</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.secondary }]}>
            <FireIcon />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>STREAK</Text>
          </View>
        </View>

        {/* Timer selector */}
        <View>
          <Text style={styles.timerLabel}>TIMER</Text>
          <View style={styles.timerRow}>
            {TIMER_OPTIONS.map((t) => (
              <Pressable
                key={t}
                style={[styles.timerChip, state.timerMode === t && styles.timerChipActive]}
                onPress={() => dispatch({ type: 'SET_TIMER', payload: t as TimerMode })}
              >
                <Text style={[styles.timerChipText, state.timerMode === t && styles.timerChipTextActive]}>
                  {t}s
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* CTA buttons */}
        <GradientButton
          label="Start Playing"
          onPress={() => navigation.navigate('Game', {})}
        />
        <GhostButton
          label="Daily Challenge"
          onPress={() => navigation.navigate('DailyChallenge', {})}
        />

        {/* Banner ad */}
        <View style={styles.bannerContainer}>
          <BannerAd
            unitId={BANNER_ID}
            size={BannerAdSize.MEDIUM_RECTANGLE}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 20,
  },
  orbViolet: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(108,71,255,0.18)',
  },
  orbCoral: {
    position: 'absolute',
    bottom: '20%',
    right: '20%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(146,4,24,0.08)',
  },
  wordmark: {
    fontFamily: Fonts.headlineEB,
    fontSize: 36,
    color: Colors.primaryContainer,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  langPill: {
    alignSelf: 'center',
    backgroundColor: Colors.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  langPillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.onSurface,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderLeftWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 4,
  },
  statValue: {
    fontFamily: Fonts.game,
    fontSize: 20,
    color: Colors.onSurface,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  timerLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    marginBottom: 10,
  },
  timerRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  timerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surfaceLow,
    minWidth: 48,
    alignItems: 'center',
  },
  timerChipActive: { backgroundColor: Colors.primaryContainer },
  timerChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  timerChipTextActive: { color: '#ffffff' },
  bannerContainer: {
    alignItems: 'center',
    marginTop: 8,
    width: 300,
    height: 250,
    alignSelf: 'center',
  },
})
