import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';

export const HistoryScreen: React.FC = () => {
  const { matchHistory, clearMatchHistory, profile, navigateTo } = useApp();
  const [filter, setFilter] = useState<'All' | 'Victory' | 'Defeat'>('All');

  const filteredMatches = matchHistory.filter((m) => {
    if (filter === 'All') return true;
    return m.outcome === filter;
  });

  const handleClear = () => {
    Alert.alert(
      'Clear Match History',
      'Are you sure you want to delete your local match history? Your leaderboard ranking points will remain unaffected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear History', style: 'destructive', onPress: clearMatchHistory },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigateTo('DASHBOARD')}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle}>MY MATCH HISTORY</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {profile.displayName} • {matchHistory.length} Matches
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClear}
          style={styles.trashBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Career Stats Grid */}
        <GlowCard variant="glowCyan" style={styles.careerCard}>
          <Text style={styles.careerTitle}>CAREER PERFORMANCE</Text>
          <View style={styles.careerGrid}>
            <View style={styles.careerItem}>
              <Text style={styles.careerVal}>{profile.stats.gamesPlayed}</Text>
              <Text style={styles.careerLabel}>GAMES PLAYED</Text>
            </View>
            <View style={styles.careerDivider} />
            <View style={styles.careerItem}>
              <Text style={[styles.careerVal, { color: COLORS.success }]}>
                {profile.stats.winRate}%
              </Text>
              <Text style={styles.careerLabel}>WIN RATE</Text>
            </View>
            <View style={styles.careerDivider} />
            <View style={styles.careerItem}>
              <Text style={[styles.careerVal, { color: COLORS.primaryContainer }]}>
                {profile.stats.averageAttempts}
              </Text>
              <Text style={styles.careerLabel}>AVG GUESSES</Text>
            </View>
          </View>
        </GlowCard>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['All', 'Victory', 'Defeat'] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.filterPill,
                filter === opt && styles.activeFilterPill,
              ]}
              onPress={() => setFilter(opt)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === opt && styles.activeFilterText,
                ]}
              >
                {opt === 'All' ? 'ALL MATCHES' : opt === 'Victory' ? 'VICTORIES' : 'DEFEATS'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Match List */}
        {filteredMatches.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>No match records found</Text>
            <Text style={styles.emptySub}>
              Play a solo game or join a multiplayer room to build your career history.
            </Text>
          </View>
        ) : (
          <View style={styles.matchList}>
            {filteredMatches.map((item) => {
              const isWin = item.outcome === 'Victory';
              return (
                <View key={item.id} style={styles.matchCard}>
                  <View style={styles.matchTop}>
                    <View style={styles.matchMeta}>
                      <View
                        style={[
                          styles.outcomeBadge,
                          {
                            backgroundColor: isWin
                              ? 'rgba(52, 211, 153, 0.15)'
                              : 'rgba(255, 180, 171, 0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.outcomeText,
                            { color: isWin ? COLORS.success : COLORS.error },
                          ]}
                        >
                          {item.outcome}
                        </Text>
                      </View>
                      <Text style={styles.modeText}>{item.mode} • {item.difficultyOrMode}</Text>
                    </View>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>

                  <View style={styles.matchDetails}>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>TARGET</Text>
                      <Text style={styles.detailVal}>{item.targetNumber}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>ATTEMPTS</Text>
                      <Text style={styles.detailVal}>{item.attempts}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>SCORE</Text>
                      <Text style={[styles.detailVal, { color: COLORS.primaryContainer }]}>
                        +{item.score}
                      </Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>TIME</Text>
                      <Text style={styles.detailVal}>{item.durationSeconds}s</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
    fontWeight: '600',
  },
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 16,
    paddingBottom: 110,
  },
  careerCard: {
    padding: SPACING.lg,
    marginVertical: SPACING.md,
  },
  careerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  careerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  careerItem: {
    alignItems: 'center',
    flex: 1,
  },
  careerVal: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  careerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
    marginTop: 4,
  },
  careerDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.outlineVariant,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  filterPill: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  activeFilterPill: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderColor: COLORS.secondary,
  },
  filterText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeFilterText: {
    color: COLORS.secondary,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  matchList: {
    gap: 10,
  },
  matchCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  matchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  matchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  outcomeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modeText: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  dateText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  detailCol: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    fontWeight: '800',
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 2,
  },
});
