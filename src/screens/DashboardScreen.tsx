import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';

export const DashboardScreen: React.FC = () => {
  const { profile, navigateTo } = useApp();

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userSection}
          activeOpacity={0.8}
          onPress={() => navigateTo('PROFILE')}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(profile.displayName || 'P').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.playerName} numberOfLines={1}>
              {profile.displayName} 👋
            </Text>
          </View>
        </TouchableOpacity>

        {/* Points Pill */}
        <TouchableOpacity
          style={styles.pointsPill}
          onPress={() => navigateTo('LEADERBOARD')}
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={15} color={COLORS.primaryContainer} />
          <Text style={styles.pointsValue}>{profile.points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>PTS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 3 Real Stats Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Ionicons name="flame" size={14} color={COLORS.error} />
              <Text style={styles.statLabel}>STREAK</Text>
            </View>
            <Text style={[styles.statValue, { color: COLORS.error }]}>
              {profile.stats.currentStreak} 🔥
            </Text>
            <Text style={styles.statSub}>Best: {profile.stats.bestStreak}</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Ionicons name="ribbon" size={14} color={COLORS.success} />
              <Text style={styles.statLabel}>WIN RATE</Text>
            </View>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {profile.stats.winRate}%
            </Text>
            <Text style={styles.statSub}>{profile.stats.wins} wins</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Ionicons name="trophy" size={14} color={COLORS.primaryContainer} />
              <Text style={styles.statLabel}>BEST</Text>
            </View>
            <Text style={[styles.statValue, { color: COLORS.primaryContainer }]}>
              {profile.stats.highScore.toLocaleString()}
            </Text>
            <Text style={styles.statSub}>High score</Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>SELECT GAME MODE</Text>

        {/* 1. Solo Game Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigateTo('DIFFICULTY_SELECT')}
          style={styles.modeCardWrapper}
        >
          <GlowCard variant="glowAmber" style={styles.modeCard}>
            <View style={styles.modeTop}>
              <View style={[styles.modeIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.14)' }]}>
                <Ionicons name="game-controller" size={28} color={COLORS.primaryContainer} />
              </View>
              <View style={styles.modeInfo}>
                <View style={styles.modeTitleRow}>
                  <Text style={styles.modeTitle}>SINGLE PLAYER</Text>
                  <View style={styles.modeBadgeGold}>
                    <Text style={styles.modeBadgeGoldText}>3 STAGES</Text>
                  </View>
                </View>
                <Text style={styles.modeSubtitle}>
                  Easy (1–50) • Medium (1–100) • Hard (1–1,000)
                </Text>
              </View>
            </View>

            <View style={styles.modeBtnGold}>
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={styles.modeBtnGoldText}>PLAY SOLO</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </View>
          </GlowCard>
        </TouchableOpacity>

        {/* 2. 1v1 Multiplayer Duel Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigateTo('MULTIPLAYER_MENU')}
          style={styles.modeCardWrapper}
        >
          <GlowCard variant="glowCyan" style={styles.modeCard}>
            <View style={styles.modeTop}>
              <View style={[styles.modeIconBox, { backgroundColor: 'rgba(2, 132, 199, 0.14)' }]}>
                <Ionicons name="people" size={28} color={COLORS.secondary} />
              </View>
              <View style={styles.modeInfo}>
                <View style={styles.modeTitleRow}>
                  <Text style={styles.modeTitle}>1v1 MULTIPLAYER</Text>
                  <View style={styles.modeBadgeCyan}>
                    <Text style={styles.modeBadgeCyanText}>LIVE DUEL</Text>
                  </View>
                </View>
                <Text style={styles.modeSubtitle}>
                  Duel a friend with a private 4-digit room code
                </Text>
              </View>
            </View>

            <View style={styles.modeBtnCyan}>
              <Ionicons name="flash" size={16} color="#FFFFFF" />
              <Text style={styles.modeBtnCyanText}>PLAY 1v1 DUEL</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </View>
          </GlowCard>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 60,
    marginTop: 40,
    paddingHorizontal: SPACING.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
  },
  avatarText: {
    color: COLORS.primaryContainer,
    fontSize: 15,
    fontWeight: '900',
  },
  greetingText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
  },
  playerName: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: '800',
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    gap: 5,
  },
  pointsValue: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '900',
  },
  pointsLabel: {
    color: COLORS.primaryContainer,
    fontSize: 10,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 16,
    paddingBottom: 110,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    marginVertical: 1,
  },
  statSub: {
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  modeCardWrapper: {
    marginBottom: 14,
  },
  modeCard: {
    padding: 16,
    borderRadius: 18,
  },
  modeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  modeIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeInfo: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  modeBadgeGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  modeBadgeGoldText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primaryContainer,
  },
  modeBadgeCyan: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  modeBadgeCyanText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  modeSubtitle: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    lineHeight: 16,
  },
  modeBtnGold: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
    height: 44,
    borderRadius: RADIUS.full,
    gap: 8,
  },
  modeBtnGoldText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  modeBtnCyan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    height: 44,
    borderRadius: RADIUS.full,
    gap: 8,
  },
  modeBtnCyanText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
