import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';

export const SoloResultScreen: React.FC = () => {
  const { soloGame, startSoloGame, profile } = useApp();

  // Rewarding celebration animations
  const bounceAnim = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch { }
    }

    // Trophy spring bounce
    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 4,
      tension: 45,
      useNativeDriver: true,
    }).start();

    // Fade in stats & buttons
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Soft celebration aura loop
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim, fadeAnim, pulseAnim]);

  if (!soloGame) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.replace(ROUTES.dashboard)}>
          <Text style={styles.backLink}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const durationSec = soloGame.endTime
    ? Math.max(1, Math.round((soloGame.endTime - soloGame.startTime) / 1000))
    : 15;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace(ROUTES.dashboard)}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MATCH RESULT</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Rewarding Victory Banner Card */}
        <GlowCard variant="glowAmber" style={styles.victoryCard}>
          {/* Animated Trophy Emblem with Glow */}
          <View style={styles.trophyContainer}>
            <Animated.View
              style={[
                styles.glowAura,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Animated.View
              style={[
                styles.trophyCircle,
                { transform: [{ scale: bounceAnim }] },
              ]}
            >
              <Ionicons name="trophy" size={52} color="#f59e0b" />
            </Animated.View>
          </View>

          {/* Victory Heading */}
          <Text style={styles.victoryHeading}>VICTORY!</Text>
          <Text style={styles.congratsText}>You cracked the code!</Text>

          {/* Secret Number Reveal Badge */}
          <View style={styles.secretBadge}>
            <Text style={styles.secretLabel}>SECRET NUMBER</Text>
            <Text style={styles.secretNumber}>{soloGame.targetNumber}</Text>
          </View>
        </GlowCard>

        {/* Real Game Stats Grid (2x2) */}
        <Animated.View style={[styles.statsGrid, { opacity: fadeAnim }]}>
          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Ionicons name="flash" size={15} color={COLORS.primaryContainer} />
              <Text style={styles.statLabel}>SCORE</Text>
            </View>
            <Text style={[styles.statValue, { color: COLORS.primaryContainer }]}>
              +{soloGame.score} PTS
            </Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Ionicons name="keypad-outline" size={15} color={COLORS.secondary} />
              <Text style={styles.statLabel}>GUESSES</Text>
            </View>
            <Text style={[styles.statValue, { color: COLORS.secondary }]}>
              {soloGame.attempts.length} / {soloGame.maxAttempts}
            </Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Ionicons name="time-outline" size={15} color={COLORS.tertiaryContainer} />
              <Text style={styles.statLabel}>TIME</Text>
            </View>
            <Text style={styles.statValue}>{durationSec}s</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Ionicons name="flame" size={15} color={COLORS.error} />
              <Text style={styles.statLabel}>STREAK</Text>
            </View>
            <Text style={[styles.statValue, { color: COLORS.error }]}>
              {profile.stats.currentStreak} 🔥
            </Text>
          </View>
        </Animated.View>

        {/* Immediate Action Buttons (No scroll needed!) */}
        <Animated.View style={[styles.actionSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => startSoloGame(soloGame.difficulty)}
            style={styles.playAgainBtn}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.playAgainText}>PLAY AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.replace(ROUTES.dashboard)}
            style={styles.dashboardBtn}
          >
            <Ionicons name="grid-outline" size={18} color={COLORS.onSurface} />
            <Text style={styles.dashboardText}>BACK TO DASHBOARD</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  backLink: {
    color: COLORS.primaryContainer,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 80,
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
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: 2,
  },
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 16,
    paddingBottom: 40,
  },
  victoryCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  trophyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  trophyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 3,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  victoryHeading: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: 1,
    marginBottom: 4,
  },
  congratsText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 16,
  },
  secretBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  secretLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  secretNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 20,
  },
  statBox: {
    width: '48.5%',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.onSurface,
  },
  actionSection: {
    gap: 10,
  },
  playAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playAgainText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dashboardText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
});
