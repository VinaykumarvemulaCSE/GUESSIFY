import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';
import { NeuralBulbLogo } from '../components/common/NeuralBulbLogo';

export const AboutScreen: React.FC = () => {
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ABOUT GUESSIFY</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.brandHero}>
          <NeuralBulbLogo size={80} />
          <Text style={styles.appName}>Guessify</Text>
          <Text style={styles.appTag}>Arcade-Intellectual Number Arena</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0 (Production Build)</Text>
          </View>
        </View>

        <GlowCard variant="normal" style={styles.infoCard}>
          <Text style={styles.infoTitle}>Architectural Overview</Text>
          <Text style={styles.infoText}>
            Built with React Native, TypeScript, and the Guessify Gaming System design tokens. Designed for mobile-first ergonomics, zero screen obstruction with custom numpads, and real-time multiplayer duel capabilities.
          </Text>
        </GlowCard>

        <GlowCard variant="glowCyan" style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: COLORS.secondary }]}>Fair Play & Anti-Cheat</Text>
          <Text style={styles.infoText}>
            In ranked multiplayer and server rounds, secret numbers and score validation are held server-side to guarantee integrity. No client can inspect or forge leaderboard scores.
          </Text>
        </GlowCard>

        <View style={styles.creditsBox}>
          <Text style={styles.creditsText}>Engineered with precision for React Native & Android.</Text>
          <Text style={styles.copyrightText}>© 2026 Guessify. All rights reserved.</Text>
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
    paddingBottom: 40,
  },
  brandHero: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: SPACING.md,
  },
  appTag: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  versionBadge: {
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  versionText: {
    color: COLORS.primaryContainer,
    fontSize: 11,
    fontWeight: '700',
  },
  infoCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryContainer,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.onSurface,
    lineHeight: 19,
  },
  creditsBox: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: 4,
  },
  creditsText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  copyrightText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    opacity: 0.6,
  },
});
