import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';

interface NeuralBulbLogoProps {
  size?: number;
  glow?: boolean;
}

export const NeuralBulbLogo: React.FC<NeuralBulbLogoProps> = ({ size = 96, glow = true }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {glow && (
        <View
          style={[
            styles.glowAura,
            {
              width: size * 1.15,
              height: size * 1.15,
              borderRadius: (size * 1.15) / 2,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.badgeRing,
          {
            width: size,
            height: size,
            borderRadius: size * 0.22,
          },
        ]}
      >
        <Image
          source={require('../../../assets/icon.png')}
          style={{
            width: size,
            height: size,
            borderRadius: size * 0.22,
          }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    backgroundColor: 'rgba(123, 208, 255, 0.25)',
    ...SHADOWS.glowSecondary,
  },
  badgeRing: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(123, 208, 255, 0.4)',
    backgroundColor: COLORS.surfaceContainerLowest,
  },
});
