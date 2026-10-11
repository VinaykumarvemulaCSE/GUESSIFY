import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface GlowCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'normal' | 'glowAmber' | 'glowCyan' | 'glowViolet';
  padding?: number;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  style,
  variant = 'normal',
  padding = SPACING.md,
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'glowAmber':
        return 'rgba(184, 134, 11, 0.5)';
      case 'glowCyan':
        return 'rgba(139, 94, 60, 0.4)';
      case 'glowViolet':
        return 'rgba(160, 101, 53, 0.4)';
      default:
        return COLORS.outlineVariant;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: getBorderColor(),
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    borderWidth: 1.2,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#5C3A21',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
