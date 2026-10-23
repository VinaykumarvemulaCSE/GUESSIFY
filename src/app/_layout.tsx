import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

/**
 * Last-resort screen: a render crash shows a way back instead of a blank app.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorBody}>
        {error?.message || 'The screen could not be rendered.'}
      </Text>
      <Pressable style={styles.errorButton} onPress={() => retry()}>
        <Text style={styles.errorButtonText}>TRY AGAIN</Text>
      </Pressable>
    </View>
  );
}

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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    height: 48,
    paddingHorizontal: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButtonText: {
    color: COLORS.onPrimary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
