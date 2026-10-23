import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ROUTES } from '../lib/routes';
import { COLORS, SPACING } from '../constants/theme';
import { NeonButton } from '../components/common/NeonButton';
import { NeuralBulbLogo } from '../components/common/NeuralBulbLogo';

import { StorageService } from '../services/storage';

const SLIDES = [
  {
    id: 1,
    title: 'Think, Guess, Win',
    subtitle: 'THE ULTIMATE NUMBER ARENA',
    description:
      'Crack secret numbers using logic, intuition, and real-time tactical feedback. Train your mind across multiple difficulty levels.',
    icon: 'bulb-outline' as const,
    accentColor: COLORS.primaryContainer,
  },
  {
    id: 2,
    title: 'Tactical Feedback',
    subtitle: 'NARROW DOWN THE TARGET',
    description:
      'Every guess brings instant visual cues: Too High, Too Low, or Dead On. Unlock smart hints when you need an edge.',
    icon: 'radio-outline' as const,
    accentColor: COLORS.secondary,
  },
  {
    id: 3,
    title: 'Play With Friends',
    subtitle: 'REAL-TIME 2-PLAYER DUELS',
    description:
      'Create private rooms with simple 6-character codes. Race together or take turns setting secret numbers.',
    icon: 'people-outline' as const,
    accentColor: COLORS.tertiaryContainer,
  },
];

export const OnboardingScreen: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await StorageService.setSeenOnboarding();
      router.replace(ROUTES.login);
    }
  };

  const handleSkip = async () => {
    await StorageService.setSeenOnboarding();
    router.replace(ROUTES.login);
  };

  const slide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      {/* Top Header / Skip */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <NeuralBulbLogo size={36} glow={false} />
          <Text style={styles.brandTitle}>Guessify</Text>
        </View>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipBtn}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Center Illustration & Content */}
      <View style={styles.centerSection}>
        <View style={[styles.iconCircle, { borderColor: slide.accentColor }]}>
          <Ionicons name={slide.icon} size={64} color={slide.accentColor} />
        </View>

        <Text style={[styles.subtitle, { color: slide.accentColor }]}>
          {slide.subtitle}
        </Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>

        {/* Indicators */}
        <View style={styles.indicators}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIndex === idx && {
                  width: 24,
                  backgroundColor: slide.accentColor,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <NeonButton
          title={currentIndex === SLIDES.length - 1 ? 'GET STARTED' : 'NEXT'}
          variant="primary"
          size="lg"
          onPress={handleNext}
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.margin,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontWeight: '800',
  },
  skipBtn: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  footer: {
    width: '100%',
  },
});
