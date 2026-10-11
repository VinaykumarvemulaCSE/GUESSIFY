import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GuessResult } from '../../types';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface FeedbackBadgeProps {
  result: GuessResult | null;
  guessNumber?: number;
}

export const FeedbackBadge: React.FC<FeedbackBadgeProps> = ({ result, guessNumber }) => {
  if (!result) return null;

  const getConfig = () => {
    switch (result) {
      case 'TOO_HIGH':
        return {
          icon: 'arrow-down-circle-sharp' as const,
          label: 'TOO HIGH',
          subtitle: 'Aim much lower!',
          bg: 'rgba(255, 82, 82, 0.18)',
          border: '#ff5252',
          color: '#ff5252',
        };
      case 'HIGH':
        return {
          icon: 'arrow-down-outline' as const,
          label: 'HIGH',
          subtitle: 'Warm! Aim slightly lower.',
          bg: 'rgba(251, 191, 36, 0.18)',
          border: '#fbbf24',
          color: '#fbbf24',
        };
      case 'LOW':
        return {
          icon: 'arrow-up-outline' as const,
          label: 'LOW',
          subtitle: 'Warm! Aim slightly higher.',
          bg: 'rgba(123, 208, 255, 0.18)',
          border: '#7bd0ff',
          color: '#7bd0ff',
        };
      case 'TOO_LOW':
        return {
          icon: 'arrow-up-circle-sharp' as const,
          label: 'TOO LOW',
          subtitle: 'Aim much higher!',
          bg: 'rgba(59, 130, 246, 0.18)',
          border: '#3b82f6',
          color: '#3b82f6',
        };
      case 'CORRECT':
        return {
          icon: 'checkmark-circle-sharp' as const,
          label: 'CORRECT!',
          subtitle: 'Target neutralized!',
          bg: 'rgba(52, 211, 153, 0.22)',
          border: COLORS.success,
          color: COLORS.success,
        };
    }
  };

  const config = getConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Ionicons name={config.icon} size={28} color={config.color} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: config.color }]}>
          {guessNumber !== undefined ? `${guessNumber} is ` : ''}
          {config.label}
        </Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginVertical: SPACING.xs,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
});
