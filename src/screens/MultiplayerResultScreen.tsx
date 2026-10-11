import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { NeonButton } from '../components/common/NeonButton';
import { GlowCard } from '../components/common/GlowCard';
import { MULTIPLAYER_POINTS } from '../constants/gameRules';

export const MultiplayerResultScreen: React.FC = () => {
  const { activeRoom, profile, requestRematch, leaveRoom } = useApp();

  if (!activeRoom) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={leaveRoom}>
          <Text style={styles.backLink}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMeWinner = activeRoom.winnerUid === profile.uid;
  const winnerName = isMeWinner
    ? profile.displayName
    : activeRoom.guestName || 'Opponent';

  const rematchCount = activeRoom.rematchAgreed.length;
  const hasAgreedRematch = activeRoom.rematchAgreed.includes(profile.uid);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Crown Section */}
        <View style={styles.topSection}>
          <View style={[styles.crownCircle, isMeWinner ? styles.crownWin : styles.crownLose]}>
            <Ionicons
              name={isMeWinner ? 'trophy' : 'medal'}
              size={50}
              color={isMeWinner ? COLORS.primaryContainer : COLORS.secondary}
            />
          </View>
          <Text style={styles.resultHeading}>
            {isMeWinner ? 'VICTORY CLAIMS YOU!' : 'DEFEATED BY RIVAL'}
          </Text>
          <Text style={styles.winnerSub}>
            {winnerName} deciphered the target first!
          </Text>

          {/* Points Pill */}
          <View style={styles.pointsAwardPill}>
            <Ionicons name="flash" size={18} color={COLORS.primaryContainer} />
            <Text style={styles.pointsAwardText}>
              +{isMeWinner ? MULTIPLAYER_POINTS.WIN : MULTIPLAYER_POINTS.LOSS} RANK PTS
            </Text>
          </View>
        </View>

        {/* Match Target Card */}
        <GlowCard variant={isMeWinner ? 'glowAmber' : 'glowCyan'} style={styles.targetCard}>
          <View style={styles.targetRow}>
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>SECRET NUMBER</Text>
              <Text style={styles.targetVal}>{activeRoom.targetNumber}</Text>
            </View>
            <View style={styles.targetDivider} />
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>TOTAL TURNS</Text>
              <Text style={styles.targetVal}>{activeRoom.guesses.length}</Text>
            </View>
          </View>
        </GlowCard>

        {/* Rematch Ready Box */}
        <View style={styles.rematchCard}>
          <Ionicons name="repeat" size={24} color={COLORS.secondary} />
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.rematchTitle}>Ready for Rematch?</Text>
            <Text style={styles.rematchSub}>
              {rematchCount}/2 players ready • Keep current room alive
            </Text>
          </View>
          <View style={styles.rematchPill}>
            <Text style={styles.rematchPillText}>{rematchCount}/2</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.actionSection}>
          <NeonButton
            title={hasAgreedRematch ? 'WAITING FOR OPPONENT...' : 'PROPOSE REMATCH'}
            variant="primary"
            size="lg"
            disabled={hasAgreedRematch}
            onPress={requestRematch}
            style={{ width: '100%', marginBottom: SPACING.md }}
          />

          <NeonButton
            title="LEAVE ROOM & RETURN"
            variant="outline"
            size="md"
            onPress={leaveRoom}
            style={{ width: '100%' }}
          />
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
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backLink: {
    color: COLORS.primaryContainer,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  crownCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: SPACING.md,
  },
  crownWin: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: COLORS.primaryContainer,
    ...SHADOWS.glowPrimary,
  },
  crownLose: {
    backgroundColor: 'rgba(123, 208, 255, 0.12)',
    borderColor: COLORS.secondary,
  },
  resultHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  winnerSub: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  pointsAwardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primaryContainer,
    marginTop: SPACING.md,
  },
  pointsAwardText: {
    color: COLORS.primaryContainer,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  targetItem: {
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  targetVal: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  targetDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.outlineVariant,
  },
  rematchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(123, 208, 255, 0.25)',
    marginBottom: SPACING.xl,
  },
  rematchTitle: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: '800',
  },
  rematchSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  rematchPill: {
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  rematchPillText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  actionSection: {
    width: '100%',
  },
});
