import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';

export const LeaderboardScreen: React.FC = () => {
  const { leaderboardUsers, navigateTo, refreshLeaderboard, profile } = useApp();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');
  const [refreshing, setRefreshing] = useState(false);

  const handlePeriodChange = async (newPeriod: 'weekly' | 'monthly' | 'allTime') => {
    setPeriod(newPeriod);
    setRefreshing(true);
    await refreshLeaderboard(newPeriod);
    setRefreshing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLeaderboard(period);
    setRefreshing(false);
  };

  const top1 = leaderboardUsers.find((u) => u.rank === 1);
  const top2 = leaderboardUsers.find((u) => u.rank === 2);
  const top3 = leaderboardUsers.find((u) => u.rank === 3);
  const currentUser = leaderboardUsers.find((u) => u.isCurrentUser) || (profile ? {
    uid: profile.uid,
    rank: 1,
    displayName: profile.displayName || profile.email.split('@')[0] || 'Cipher',
    points: profile.points || 0,
    tier: (profile.stats.winRate >= 80 ? 'Master' : profile.stats.winRate >= 50 ? 'Diamond' : 'Gold') as any,
    wins: profile.stats.wins,
    isCurrentUser: true,
  } : null);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigateTo('DASHBOARD')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HALL OF CIPHERS</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.primaryContainer} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryContainer}
            colors={[COLORS.primaryContainer]}
          />
        }
      >
        {/* Period Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, period === 'weekly' && styles.activeTabBtn]}
            onPress={() => handlePeriodChange('weekly')}
          >
            <Text
              style={[
                styles.tabText,
                period === 'weekly' && { color: COLORS.primaryContainer },
              ]}
            >
              WEEKLY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, period === 'monthly' && styles.activeTabBtn]}
            onPress={() => handlePeriodChange('monthly')}
          >
            <Text
              style={[
                styles.tabText,
                period === 'monthly' && { color: COLORS.secondary },
              ]}
            >
              MONTHLY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, period === 'allTime' && styles.activeTabBtn]}
            onPress={() => handlePeriodChange('allTime')}
          >
            <Text
              style={[
                styles.tabText,
                period === 'allTime' && { color: COLORS.tertiaryContainer },
              ]}
            >
              ALL-TIME
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reset Countdown Notice */}
        <View style={styles.resetNotice}>
          <Ionicons name="time-outline" size={14} color={COLORS.onSurfaceVariant} />
          <Text style={styles.resetNoticeText}>
            Weekly board resets Monday 00:00 UTC
          </Text>
        </View>

        {/* Top 3 Championship Podium (Always balanced 3 pillars) */}
        <View style={styles.podiumContainer}>
          {/* Rank 2 (Silver) */}
          <View style={[styles.podiumCol, { marginTop: 28 }]}>
            <View style={[styles.podiumAvatar, styles.silverBorder]}>
              <Ionicons
                name={top2 ? "medal" : "person-outline"}
                size={22}
                color={top2 ? "#94a3b8" : COLORS.outlineVariant}
              />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {top2 ? top2.displayName : 'Awaiting...'}
            </Text>
            <Text style={styles.podiumPoints}>
              {top2 ? `${top2.points} pts` : '-- pts'}
            </Text>
            <View style={[styles.podiumPillar, { height: 70, backgroundColor: 'rgba(148, 163, 184, 0.18)' }]}>
              <Text style={[styles.pillarRank, { color: '#64748b' }]}>2</Text>
            </View>
          </View>

          {/* Rank 1 (Gold - Centerpiece) */}
          <View style={styles.podiumCol}>
            <Ionicons name="trophy" size={26} color={COLORS.primaryContainer} style={{ marginBottom: 4 }} />
            <View style={[styles.podiumAvatar, styles.goldBorder]}>
              <Ionicons
                name={top1 ? "ribbon" : "person-outline"}
                size={26}
                color={COLORS.primaryContainer}
              />
            </View>
            <Text style={[styles.podiumName, { color: COLORS.primaryContainer }]} numberOfLines={1}>
              {top1 ? top1.displayName : 'Awaiting...'}
            </Text>
            <Text style={styles.podiumPoints}>
              {top1 ? `${top1.points} pts` : '-- pts'}
            </Text>
            <View style={[styles.podiumPillar, { height: 95, backgroundColor: 'rgba(184, 134, 11, 0.22)' }]}>
              <Text style={[styles.pillarRank, { color: COLORS.primaryContainer }]}>1</Text>
            </View>
          </View>

          {/* Rank 3 (Bronze) */}
          <View style={[styles.podiumCol, { marginTop: 42 }]}>
            <View style={[styles.podiumAvatar, styles.bronzeBorder]}>
              <Ionicons
                name={top3 ? "medal" : "person-outline"}
                size={20}
                color={top3 ? "#cd7f32" : COLORS.outlineVariant}
              />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {top3 ? top3.displayName : 'Awaiting...'}
            </Text>
            <Text style={styles.podiumPoints}>
              {top3 ? `${top3.points} pts` : '-- pts'}
            </Text>
            <View style={[styles.podiumPillar, { height: 55, backgroundColor: 'rgba(205, 127, 50, 0.18)' }]}>
              <Text style={[styles.pillarRank, { color: '#8b5a2b' }]}>3</Text>
            </View>
          </View>
        </View>

        {/* Pinned Current Player Rank */}
        {currentUser && (
          <GlowCard variant="glowAmber" style={styles.pinnedCard}>
            <View style={styles.pinnedLeft}>
              <View style={styles.pinnedRankCircle}>
                <Text style={styles.pinnedRankText}>#{currentUser.rank}</Text>
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.pinnedName}>{currentUser.displayName} (You)</Text>
                <Text style={styles.pinnedTier}>{currentUser.tier} • {currentUser.wins} Wins</Text>
              </View>
            </View>
            <Text style={styles.pinnedPoints}>{currentUser.points} PTS</Text>
          </GlowCard>
        )}

        {/* Other Ranks (4+) */}
        <Text style={styles.listSectionHeader}>GLOBAL CONTENDERS</Text>
        <View style={styles.rankList}>
          {leaderboardUsers.filter((u) => u.rank > 3).length === 0 ? (
            <View style={styles.emptyContendersCard}>
              <Ionicons name="sparkles-outline" size={20} color={COLORS.primaryContainer} />
              <Text style={styles.emptyContendersText}>
                No additional contenders yet. Play Solo & Multiplayer matches to climb the leaderboard!
              </Text>
            </View>
          ) : (
            leaderboardUsers
              .filter((u) => u.rank > 3)
              .map((user) => (
                <View key={user.uid} style={styles.rankRow}>
                  <View style={styles.rankNumBadge}>
                    <Text style={styles.rankNumText}>#{user.rank}</Text>
                  </View>
                  <View style={styles.userCenter}>
                    <Text style={styles.listUserName}>{user.displayName}</Text>
                    <Text style={styles.listUserTier}>{user.tier}</Text>
                  </View>
                  <Text style={styles.listPoints}>{user.points} PTS</Text>
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.margin,
    paddingTop: 50,
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingBottom: 110,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  activeTabBtn: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  resetNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: SPACING.lg,
  },
  resetNoticeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: SPACING.xl,
    paddingHorizontal: 10,
    gap: 8,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
  },
  goldBorder: {
    borderColor: COLORS.primaryContainer,
    ...SHADOWS.glowPrimary,
  },
  silverBorder: {
    borderColor: '#c0c0c0',
  },
  bronzeBorder: {
    borderColor: '#cd7f32',
  },
  podiumName: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  podiumPoints: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
    marginBottom: 6,
  },
  podiumPillar: {
    width: '100%',
    borderTopLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarRank: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  pinnedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  pinnedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedRankCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedRankText: {
    color: COLORS.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  pinnedName: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: '800',
  },
  pinnedTier: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 2,
  },
  pinnedPoints: {
    color: COLORS.primaryContainer,
    fontSize: 16,
    fontWeight: '800',
  },
  listSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  rankList: {
    gap: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  rankNumBadge: {
    width: 32,
    alignItems: 'center',
  },
  rankNumText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
  },
  userCenter: {
    flex: 1,
    marginLeft: 10,
  },
  listUserName: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  listUserTier: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  listPoints: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContendersCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  emptyContendersText: {
    flex: 1,
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
  },
});
