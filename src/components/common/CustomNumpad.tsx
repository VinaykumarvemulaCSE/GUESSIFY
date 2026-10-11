import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface CustomNumpadProps {
  onNumberPress: (num: string) => void;
  onDeletePress: () => void;
  onSubmitPress: () => void;
  submitDisabled?: boolean;
}

export const CustomNumpad: React.FC<CustomNumpadProps> = ({
  onNumberPress,
  onDeletePress,
  onSubmitPress,
  submitDisabled = false,
}) => {
  const triggerHaptic = (type: 'key' | 'submit') => {
    if (Platform.OS !== 'web') {
      try {
        if (type === 'submit') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch {}
    }
  };

  const handleNum = (val: string) => {
    triggerHaptic('key');
    onNumberPress(val);
  };

  const handleDelete = () => {
    triggerHaptic('key');
    onDeletePress();
  };

  const handleSubmit = () => {
    if (submitDisabled) return;
    triggerHaptic('submit');
    onSubmitPress();
  };

  const renderKey = (val: string) => (
    <TouchableOpacity
      key={val}
      activeOpacity={0.7}
      style={styles.keyBtn}
      onPress={() => handleNum(val)}
    >
      <Text style={styles.keyText}>{val}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Row 1 */}
      <View style={styles.row}>
        {renderKey('1')}
        {renderKey('2')}
        {renderKey('3')}
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        {renderKey('4')}
        {renderKey('5')}
        {renderKey('6')}
      </View>

      {/* Row 3 */}
      <View style={styles.row}>
        {renderKey('7')}
        {renderKey('8')}
        {renderKey('9')}
      </View>

      {/* Row 4 */}
      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.keyBtn, styles.actionKeyBtn]}
          onPress={handleDelete}
        >
          <Ionicons name="backspace-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>

        {renderKey('0')}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={submitDisabled}
          style={[
            styles.keyBtn,
            styles.submitKeyBtn,
            submitDisabled && styles.submitDisabled,
          ]}
          onPress={handleSubmit}
        >
          <Ionicons
            name="checkmark-sharp"
            size={28}
            color={submitDisabled ? COLORS.onSurfaceVariant : COLORS.onPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  keyBtn: {
    flex: 1,
    height: 56,
    marginHorizontal: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontWeight: '700',
  },
  actionKeyBtn: {
    backgroundColor: 'rgba(255, 180, 171, 0.12)',
    borderColor: 'rgba(255, 180, 171, 0.25)',
  },
  submitKeyBtn: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primary,
    ...SHADOWS.glowPrimary,
  },
  submitDisabled: {
    backgroundColor: COLORS.surfaceContainerHighest,
    borderColor: 'transparent',
    opacity: 0.5,
  },
});
