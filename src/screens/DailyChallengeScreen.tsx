import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import NeuralBackground from '../components/NeuralBackground'
import {
  getDailyGoal,
  getRewardState,
  isDailyGoalCompleted,
  MILESTONES,
  type RewardState,
} from '../services/RewardService'
import { Colors, Fonts } from '../theme'

const FLAME: Record<string, string> = {
  orange: '🔥',
  blue:   '💙🔥',
  purple: '💜🔥',
  gold:   '⭐🔥',
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1)
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
    </View>
  )
}

export default function DailyChallengeScreen() {
  const insets = useSafeAreaInsets()
  const [rewards, setRewards] = useState<RewardState | null>(null)
  const [goalDone, setGoalDone] = useState(false)

  useFocusEffect(useCallback(() => { load() }, []))

  async function load() {
    const [r, done] = await Promise.all([getRewardState(), isDailyGoalCompleted()])
    setRewards(r)
    setGoalDone(done)
  }

  const goal = getDailyGoal()
  const streak = rewards?.streak ?? 0
  const nextMilestone = MILESTONES.find(m => streak < m.days)
  const daysToNext = nextMilestone ? nextMilestone.days - streak : 0
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <NeuralBackground />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Daily Goal</Text>
          <Text style={styles.date}>{today}</Text>
        </View>

        {/* Streak card */}
        <View style={styles.card}>
          <View style={styles.streakRow}>
            <Text style={styles.flameEmoji}>{FLAME[rewards?.flameColor ?? 'orange']}</Text>
            <View>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLabel}>DAY STREAK</Text>
            </View>
            {rewards?.title ? (
              <View style={styles.titleBadge}>
                <Text style={styles.titleBadgeText}>{rewards.title}</Text>
              </View>
            ) : null}
          </View>

          {nextMilestone ? (
            <View style={styles.nextMilestone}>
              <View style={styles.nextMilestoneRow}>
                <Text style={styles.nextMilestoneLabel}>Next: {nextMilestone.label}</Text>
                <Text style={styles.nextMilestoneDays}>{daysToNext} day{daysToNext !== 1 ? 's' : ''} away</Text>
              </View>
              <ProgressBar value={streak} max={nextMilestone.days} color={Colors.primaryContainer} />
              <Text style={styles.nextMilestoneReward}>🎁 {nextMilestone.reward}</Text>
            </View>
          ) : (
            <Text style={styles.allMilestonesText}>🏆 All milestones unlocked!</Text>
          )}
        </View>

        {/* Today's goal */}
        <View style={[styles.card, goalDone && styles.cardDone]}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>TODAY'S GOAL</Text>
            {goalDone ? <Text style={styles.doneCheck}>✓ Complete</Text> : null}
          </View>
          <Text style={styles.goalDescription}>{goal.label}</Text>
          {goalDone ? (
            <View style={styles.rewardRow}>
              <Text style={styles.rewardText}>🪙 +1 Continue Token earned!</Text>
            </View>
          ) : (
            <Text style={styles.goalHint}>Play any game to complete this goal</Text>
          )}
        </View>

        {/* Tokens & rewards */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>YOUR REWARDS</Text>
          <View style={styles.tokenGrid}>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenIcon}>🪙</Text>
              <Text style={styles.tokenNum}>{rewards?.continueTokens ?? 0}</Text>
              <Text style={styles.tokenLabel}>Continue{'\n'}Tokens</Text>
            </View>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenIcon}>❄️</Text>
              <Text style={styles.tokenNum}>{rewards?.freezeTokens ?? 0}</Text>
              <Text style={styles.tokenLabel}>Freeze{'\n'}Tokens</Text>
            </View>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenIcon}>⏱️</Text>
              <Text style={styles.tokenNum}>+{rewards?.bonusStartSecs ?? 0}s</Text>
              <Text style={styles.tokenLabel}>Bonus{'\n'}Start</Text>
            </View>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenIcon}>⚡</Text>
              <Text style={styles.tokenNum}>
                {rewards?.scoreMultiplier ? `${rewards.scoreMultiplier.multiplier}×` : '1×'}
              </Text>
              <Text style={styles.tokenLabel}>Score{'\n'}Mult</Text>
            </View>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>STREAK MILESTONES</Text>
          {MILESTONES.map((m) => {
            const claimed = rewards?.claimedMilestones.includes(m.id) ?? false
            const reached = streak >= m.days
            return (
              <View key={m.id} style={[styles.milestoneRow, claimed && styles.milestoneClaimed]}>
                <View style={[styles.milestoneDot, reached && styles.milestoneDotActive]} />
                <View style={styles.milestoneInfo}>
                  <Text style={[styles.milestoneName, claimed && styles.milestoneNameDone]}>
                    {m.days}-day — {m.label}
                  </Text>
                  <Text style={styles.milestoneReward}>🎁 {m.reward}</Text>
                </View>
                {claimed ? <Text style={styles.claimedBadge}>✓</Text> : null}
              </View>
            )
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  header: { marginBottom: 20 },
  title: { fontFamily: Fonts.headlineEB, fontSize: 32, color: Colors.onSurface },
  date: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 2 },

  card: {
    backgroundColor: Colors.surfaceLow,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 12,
  },
  cardDone: { borderWidth: 1, borderColor: 'rgba(58,223,171,0.3)' },

  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flameEmoji: { fontSize: 40 },
  streakNum: { fontFamily: Fonts.gameEB, fontSize: 44, color: Colors.primary, lineHeight: 48 },
  streakLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant, letterSpacing: 1.5 },
  titleBadge: {
    marginLeft: 'auto' as any,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  titleBadgeText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: '#fff' },
  allMilestonesText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.tertiary },

  nextMilestone: { gap: 8 },
  nextMilestoneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextMilestoneLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onSurface },
  nextMilestoneDays: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant },
  progressTrack: { height: 8, backgroundColor: Colors.surfaceHighest, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  nextMilestoneReward: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant },

  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalTitle: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant, letterSpacing: 1.5, textTransform: 'uppercase' },
  doneCheck: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.tertiary },
  goalDescription: { fontFamily: Fonts.headline, fontSize: 22, color: Colors.onSurface },
  goalHint: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant },
  rewardRow: { backgroundColor: 'rgba(58,223,171,0.1)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  rewardText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.tertiary },

  sectionLabel: {
    fontFamily: Fonts.body, fontSize: 10,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  tokenGrid: { flexDirection: 'row', gap: 8 },
  tokenBox: { flex: 1, backgroundColor: Colors.surfaceHigh, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  tokenIcon: { fontSize: 22 },
  tokenNum: { fontFamily: Fonts.game, fontSize: 18, color: Colors.primary },
  tokenLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant, textAlign: 'center' },

  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  milestoneClaimed: { opacity: 0.6 },
  milestoneDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.surfaceHighest },
  milestoneDotActive: { backgroundColor: Colors.primaryContainer },
  milestoneInfo: { flex: 1, gap: 2 },
  milestoneName: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurface },
  milestoneNameDone: { color: Colors.onSurfaceVariant },
  milestoneReward: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant },
  claimedBadge: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.tertiary },
})
