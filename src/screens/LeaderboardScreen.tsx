import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { getLeaderboard, type LeaderboardEntry } from '../db/dbService'
import { useGame, TIMER_OPTIONS, type TimerMode } from '../store/gameStore'
import { Colors, Fonts } from '../theme'

type Period = 'today' | 'week' | 'alltime'

const MEDAL = ['🥇', '🥈', '🥉']

const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧', de: '🇩🇪', gu: '🇮🇳', hi: '🇮🇳',
  fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹', pl: '🇵🇱', ro: '🇷🇴', nl: '🇳🇱',
}

function SkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      <View style={[styles.skeletonBox, { width: 24 }]} />
      <View style={styles.skeletonAvatar} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={[styles.skeletonBox, { width: '60%', height: 12 }]} />
        <View style={[styles.skeletonBox, { width: '30%', height: 10 }]} />
      </View>
      <View style={[styles.skeletonBox, { width: 48, height: 14 }]} />
    </View>
  )
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name?.[0]?.toUpperCase() ?? '?'
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  )
}

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) return <Text style={styles.medal}>{MEDAL[rank - 1]}</Text>
  return <Text style={styles.rankNum}>#{rank}</Text>
}

export default function LeaderboardScreen() {
  const { state } = useGame()
  const [period, setPeriod] = useState<Period>('alltime')
  const [timerFilter, setTimerFilter] = useState<TimerMode>(state.timerMode)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [period, timerFilter, state.languageId])

  async function load() {
    setLoading(true)
    const data = await getLeaderboard(state.languageId, period, timerFilter, 50)
    setEntries(data)
    setLoading(false)
  }

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'alltime', label: 'All Time' },
  ]

  const topEntry = entries[0]

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>WordFever</Text>
        <Text style={styles.headerSub}>
          {LANG_FLAGS[state.languageId] ?? '🌍'} {state.languageId.toUpperCase()} Leaderboard
        </Text>
      </View>

      {/* Period filter */}
      <View style={styles.filterRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.key}
            style={[styles.filterPill, period === p.key && styles.filterPillActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.filterText, period === p.key && styles.filterTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Timer filter */}
      <View style={styles.timerFilterRow}>
        {TIMER_OPTIONS.map((t) => (
          <Pressable
            key={t}
            style={[styles.timerPill, timerFilter === t && styles.timerPillActive]}
            onPress={() => setTimerFilter(t)}
          >
            <Text style={[styles.timerPillText, timerFilter === t && styles.timerPillTextActive]}>
              {t}s
            </Text>
          </Pressable>
        ))}
      </View>

      {/* My rank card */}
      {topEntry && (
        <View style={styles.myRankCard}>
          <Text style={styles.myRankLabel}>TOP SCORE</Text>
          <Text style={styles.myRankValue}>{topEntry.score}</Text>
          <View style={styles.myRankUser}>
            <Avatar name={topEntry.username} size={28} />
            <Text style={styles.myRankName}>{topEntry.username}</Text>
          </View>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.listContainer}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No scores yet</Text>
          <Text style={styles.emptySubtext}>Be the first to play!</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item, index }) => (
            <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
              <View style={styles.rankCell}>
                <RankCell rank={index + 1} />
              </View>
              <Avatar name={item.username} />
              <View style={styles.rowMid}>
                <Text style={styles.rowName}>{item.username}</Text>
                <View style={styles.flagPill}>
                  <Text style={styles.flagText}>
                    {LANG_FLAGS[item.languageId] ?? '🌍'} {item.languageId.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowScore}>{item.score}</Text>
                <Text style={styles.rowChain}>chain {item.chainLength}</Text>
              </View>
            </View>
          )}
        />
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
  headerSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  timerFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 6,
  },
  timerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
  },
  timerPillActive: {
    backgroundColor: Colors.primaryContainer,
  },
  timerPillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  timerPillTextActive: {
    color: '#ffffff',
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
  },
  filterPillActive: { backgroundColor: Colors.primaryContainer },
  filterText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant },
  filterTextActive: { color: '#ffffff' },

  myRankCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: Colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  myRankLabel: { fontFamily: Fonts.body, fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },
  myRankValue: { fontFamily: Fonts.game, fontSize: 28, color: '#ffffff', flex: 1 },
  myRankUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  myRankName: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: '#ffffff' },

  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowEven: { backgroundColor: Colors.surfaceLow },
  rowOdd: { backgroundColor: Colors.surface },
  rankCell: { width: 28, alignItems: 'center' },
  medal: { fontSize: 20 },
  rankNum: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant },
  rowMid: { flex: 1, gap: 4 },
  rowName: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurface },
  flagPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  flagText: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowScore: { fontFamily: Fonts.game, fontSize: 16, color: Colors.onSurface },
  rowChain: { fontFamily: Fonts.body, fontSize: 11, color: Colors.onSurfaceVariant },

  avatar: {
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.headline, color: '#ffffff' },

  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  skeletonBox: { height: 14, backgroundColor: Colors.surfaceHighest, borderRadius: 6 },
  skeletonAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceHighest,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface },
  emptySubtext: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },
})
