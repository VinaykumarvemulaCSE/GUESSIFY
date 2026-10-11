import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    onPress();
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.primaryBtn, SHADOWS.glowPrimary];
      case 'secondary':
        return [styles.secondaryBtn, SHADOWS.glowSecondary];
      case 'danger':
        return [styles.dangerBtn];
      case 'outline':
        return [styles.outlineBtn];
      case 'ghost':
        return [styles.ghostBtn];
      default:
        return [styles.primaryBtn];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      default:
        return styles.sizeMd;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        getContainerStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.onPrimary : COLORS.secondary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  baseText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sizeSm: {
    height: 38,
    paddingHorizontal: SPACING.sm,
  },
  sizeMd: {
    height: 48,
    paddingHorizontal: SPACING.lg,
  },
  sizeLg: {
    height: 56,
    paddingHorizontal: SPACING.xl,
  },
  primaryBtn: {
    backgroundColor: COLORS.primaryContainer,
  },
  primaryText: {
    color: COLORS.onPrimary,
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: COLORS.secondaryContainer,
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  dangerBtn: {
    backgroundColor: COLORS.errorContainer,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerText: {
    color: COLORS.error,
    fontSize: 15,
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
  },
  outlineText: {
    color: COLORS.secondary,
    fontSize: 15,
  },
  ghostBtn: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 15,
  },
  disabled: {
    opacity: 0.45,
  },
});
