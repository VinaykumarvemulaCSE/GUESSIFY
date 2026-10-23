import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';
import {
  ATTEMPT_PENALTY,
  DIFFICULTY_CONFIGS,
  HINT_PENALTY,
  MAX_HINTS,
  MIN_SOLO_SCORE,
  MULTIPLAYER_POINTS,
  ROOM_EXPIRY_MS,
  TURN_TIMEOUT_SECONDS,
} from '../constants/gameRules';

const DIFFICULTIES = Object.values(DIFFICULTY_CONFIGS);
const SHIELD_SUMMARY = DIFFICULTIES.map((d) => `${d.label} ${d.shields}`).join(' • ');
const ROOM_EXPIRY_MINUTES = Math.round(ROOM_EXPIRY_MS / 60000);

export const GameRulesScreen: React.FC = () => {
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GAME RULES & SCORING</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.heading}>The Guessify Codex</Text>
          <Text style={styles.subheading}>
            Learn the exact mechanics, scoring formulas, and multiplayer rules governing the arena.
          </Text>
        </View>

        {/* Section 1: Single Player Mechanics */}
        <GlowCard variant="glowAmber" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="game-controller" size={20} color={COLORS.primaryContainer} />
            <Text style={styles.cardTitle}>Single-Player Rules</Text>
          </View>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Guess Budget:</Text> {SHIELD_SUMMARY} guesses by stage. Spending the final guess without a correct answer ends the round with 0 points.
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Tactical Feedback:</Text> Every guess gets one of four directional clues — <Text style={{ color: COLORS.error }}>Too High</Text>, <Text style={{ color: COLORS.secondary }}>High (close)</Text>, <Text style={{ color: COLORS.secondary }}>Low (close)</Text>, <Text style={{ color: COLORS.error }}>Too Low</Text> — or <Text style={{ color: COLORS.success }}>Correct</Text>. “Close” means within 12% of the range.
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>{MAX_HINTS} Smart Hints:</Text> Hint 1 narrows the target range. Hint 2 reveals parity (Even/Odd) and digit sum. Each hint costs {HINT_PENALTY} points.
          </Text>
        </GlowCard>

        {/* Section 2: Deterministic Scoring Formula */}
        <GlowCard variant="glowCyan" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calculator" size={20} color={COLORS.secondary} />
            <Text style={[styles.cardTitle, { color: COLORS.secondary }]}>
              Scoring Formula
            </Text>
          </View>
          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>
              Score = max({MIN_SOLO_SCORE}, Base − {ATTEMPT_PENALTY} × (Attempts − 1) − {HINT_PENALTY} × HintsUsed)
            </Text>
          </View>
          {DIFFICULTIES.map((d) => (
            <Text key={d.id} style={styles.ruleBullet}>
              • <Text style={styles.bold}>{d.label} ({d.min}–{d.max}):</Text> Base {d.baseScore} PTS
            </Text>
          ))}
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Loss / Surrender:</Text> 0 PTS
          </Text>
        </GlowCard>

        {/* Section 3: Multiplayer Rules */}
        <GlowCard variant="glowViolet" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={20} color={COLORS.tertiaryContainer} />
            <Text style={[styles.cardTitle, { color: COLORS.tertiaryContainer }]}>
              Multiplayer Room Duels
            </Text>
          </View>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Both Together:</Text> Alternating turns with a {TURN_TIMEOUT_SECONDS}s turn timer. The first correct guess wins the round.
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Setter Modes:</Text> One player sets the secret and scores each guess from memory; the guesser keeps the floor until they solve it. There is no attempt cap.
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Point Awards:</Text> Winner +{MULTIPLAYER_POINTS.WIN} PTS • Other player +{MULTIPLAYER_POINTS.LOSS} PTS.
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Fair Play:</Text> The secret is never written to Firestore while a round is live, and only the setter can score guesses.
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Room Expiry:</Text> Rooms close after {ROOM_EXPIRY_MINUTES} minutes without activity.
          </Text>
        </GlowCard>
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
    paddingBottom: 40,
  },
  titleSection: {
    marginVertical: SPACING.md,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 20,
  },
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryContainer,
  },
  ruleBullet: {
    fontSize: 13,
    color: COLORS.onSurface,
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '800',
  },
  formulaBox: {
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(123, 208, 255, 0.3)',
  },
  formulaText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
});
