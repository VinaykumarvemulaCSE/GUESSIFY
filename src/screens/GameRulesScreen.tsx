import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';

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
            • <Text style={styles.bold}>10 Attempts Maximum:</Text> You have exactly 10 guesses to find the secret number. The 10th incorrect guess results in Game Over.
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Tactical Feedback:</Text> Every valid guess receives instant feedback: <Text style={{ color: COLORS.error }}>🔼 Too High</Text>, <Text style={{ color: COLORS.secondary }}>🔽 Too Low</Text>, or <Text style={{ color: COLORS.success }}>✅ Correct</Text>.
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>2 Smart Hints:</Text> Hint 1 narrows down the target range. Hint 2 reveals parity (Even/Odd) and digit sum. Each hint deducts 50 points.
          </Text>
        </GlowCard>

        {/* Section 2: Deterministic Scoring Formula */}
        <GlowCard variant="glowCyan" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calculator" size={20} color={COLORS.secondary} />
            <Text style={[styles.cardTitle, { color: COLORS.secondary }]}>
              Scoring Formula (PRD v1.1)
            </Text>
          </View>
          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>
              Score = max(50, Base − 25 × (Attempts − 1) − 50 × HintsUsed)
            </Text>
          </View>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Easy (1–50):</Text> Base 500 PTS
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Medium (1–100):</Text> Base 800 PTS
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Hard (1–1000):</Text> Base 1000 PTS
          </Text>
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
            • <Text style={styles.bold}>Both Together:</Text> Alternating turns with a 30s turn timer. First correct guess claims the victory!
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Setter Modes:</Text> Guesser wins by solving within 10 attempts; otherwise the setter wins.
          </Text>
          <Text style={styles.ruleBullet}>
            • <Text style={styles.bold}>Point Awards:</Text> Winner: +150 PTS • Loser: +45 PTS • Draw: +75 PTS.
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
