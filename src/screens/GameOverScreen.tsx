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
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';

export const GameOverScreen: React.FC = () => {
  const { soloGame, startSoloGame, navigateTo } = useApp();

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      delay: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, fadeAnim]);

  if (!soloGame) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigateTo('DASHBOARD')}>
          <Text style={styles.backLink}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const durationSec = soloGame.endTime
    ? Math.max(1, Math.round((soloGame.endTime - soloGame.startTime) / 1000))
    : 30;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigateTo('DASHBOARD')}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MATCH RESULT</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Defeat Card */}
        <GlowCard variant="normal" style={styles.defeatCard}>
          <Animated.View
            style={[
              styles.iconCircle,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Ionicons name="close-circle" size={48} color={COLORS.error} />
          </Animated.View>

          <Text style={styles.defeatTitle}>GAME OVER</Text>
          <Text style={styles.defeatSub}>Out of guesses this round!</Text>

          {/* Secret Number Reveal */}
          <View style={styles.secretBadge}>
            <Text style={styles.secretLabel}>THE SECRET NUMBER WAS</Text>
            <Text style={styles.secretNumber}>{soloGame.targetNumber}</Text>
          </View>
        </GlowCard>

        {/* Real Stats Grid */}
        <Animated.View style={[styles.statsGrid, { opacity: fadeAnim }]}>
          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Ionicons name="keypad-outline" size={15} color={COLORS.error} />
              <Text style={styles.statLabel}>ATTEMPTS</Text>
            </View>
            <Text style={[styles.statValue, { color: COLORS.error }]}>
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
        </Animated.View>

        {/* Immediate Action Buttons (No scroll needed!) */}
        <Animated.View style={[styles.actionSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => startSoloGame(soloGame.difficulty)}
            style={styles.retryBtn}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigateTo('DASHBOARD')}
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
  defeatCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    marginBottom: 12,
  },
  defeatTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.error,
    letterSpacing: 1,
    marginBottom: 4,
  },
  defeatSub: {
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
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    color: COLORS.error,
    letterSpacing: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
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
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
  },
  retryText: {
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
