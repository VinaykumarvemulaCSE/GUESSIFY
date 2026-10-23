import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.surface },
            }}
          />
        </SafeAreaView>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
});
