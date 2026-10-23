import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { GameBottomNav } from '../../components/common/GameBottomNav';
import { COLORS } from '../../constants/theme';

export default function MainLayout() {
  return (
    <View style={styles.container}>
      <Slot />
      <GameBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
});
