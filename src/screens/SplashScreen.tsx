import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { NeuralBulbLogo } from '../components/common/NeuralBulbLogo';
import { StorageService } from '../services/storage';

export const SplashScreen: React.FC = () => {
  const { navigateTo } = useApp();

  const proceedToApp = useCallback(async () => {
    try {
      const seenOnboarding = await StorageService.hasSeenOnboarding();
      if (!seenOnboarding) {
        navigateTo('ONBOARDING');
        return;
      }

      // Restore session on the basis of last session credentials
      const savedProfile = await StorageService.getSavedProfile();
      if (savedProfile && !savedProfile.isGuest) {
        navigateTo('DASHBOARD');
      } else {
        // Ask user to sign in or get started
        navigateTo('LOGIN');
      }
    } catch {
      navigateTo('LOGIN');
    }
  }, [navigateTo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      proceedToApp();
    }, 1800);
    return () => clearTimeout(timer);
  }, [proceedToApp]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={proceedToApp}
      style={styles.container}
    >
      {/* Background Neon Ambient Glows */}
      <View style={styles.glowTop} />
      <View style={styles.glowCenter} />
      <View style={styles.glowBottom} />

      {/* Top Status Bar */}
      <View style={styles.topBar}>
        <View style={styles.netStatus}>
          <View style={styles.pulseDot} />
          <Text style={styles.netText}>ARCADE NET</Text>
        </View>
        <Text style={styles.versionText}>v1.1</Text>
      </View>

      {/* Central Emblem & Brand Wordmark */}
      <View style={styles.centerSection}>
        <NeuralBulbLogo size={140} />

        <Text style={styles.title}>
          Guess<Text style={styles.titleHighlight}>ify</Text>
        </Text>

        <View style={styles.tagline}>
          <Text style={styles.tagword1}>Think</Text>
          <View style={styles.dot} />
          <Text style={styles.tagword2}>Guess</Text>
          <View style={styles.dot} />
          <Text style={styles.tagword3}>Win</Text>
        </View>

        {/* Loading Pill */}
        <View style={styles.loadingPill}>
          <View style={styles.pingDot} />
          <Text style={styles.loadingText}>LOADING ARENA...</Text>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap anywhere to start</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.margin,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 30,
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    left: '20%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(123, 208, 255, 0.08)',
  },
  glowCenter: {
    position: 'absolute',
    top: '35%',
    left: '10%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    right: '10%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(210, 190, 255, 0.08)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  netText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  versionText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: SPACING.lg,
    letterSpacing: -1,
  },
  titleHighlight: {
    color: COLORS.primaryContainer,
  },
  tagline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: 8,
  },
  tagword1: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tagword2: {
    color: COLORS.primaryContainer,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tagword3: {
    color: COLORS.tertiaryContainer,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.onSurfaceVariant,
    opacity: 0.5,
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryContainer,
  },
  loadingText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    opacity: 0.6,
  },
});
