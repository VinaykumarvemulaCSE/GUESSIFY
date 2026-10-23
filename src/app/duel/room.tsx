import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { WaitingRoomScreen } from '../../screens/WaitingRoomScreen';
import { ModeSelectScreen } from '../../screens/ModeSelectScreen';
import { LiveMultiplayerScreen } from '../../screens/LiveMultiplayerScreen';
import { MultiplayerResultScreen } from '../../screens/MultiplayerResultScreen';
import { ROUTES } from '../../lib/routes';
import { useLeaveGuard } from '../../lib/useLeaveGuard';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

function RoomClosedNotice({ expired }: { expired: boolean }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={expired ? 'time-outline' : 'exit-outline'}
          size={40}
          color={COLORS.secondary}
        />
      </View>
      <Text style={styles.title}>{expired ? 'This room expired' : 'The room was closed'}</Text>
      <Text style={styles.subtitle}>
        {expired
          ? 'Rooms close after 5 minutes of inactivity.'
          : 'The other player left the match.'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace(ROUTES.dashboard)}>
        <Text style={styles.buttonText}>BACK TO HOME</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DuelRoomRoute() {
  const { activeRoom, leaveRoom } = useApp();
  const inProgress = Boolean(
    activeRoom &&
      activeRoom.status !== 'RESULT' &&
      activeRoom.status !== 'EXPIRED' &&
      activeRoom.status !== 'CLOSED'
  );

  useLeaveGuard(inProgress, 'Leave match?', 'The room closes and your opponent is sent home.', () => {
    void leaveRoom();
    router.replace(ROUTES.dashboard);
  });

  if (!activeRoom) return <Redirect href={ROUTES.duel} />;

  switch (activeRoom.status) {
    case 'MODE_SELECTION':
    case 'CONFIRMING':
      return <ModeSelectScreen />;
    case 'PLAYING':
      return <LiveMultiplayerScreen />;
    case 'RESULT':
      return <MultiplayerResultScreen />;
    case 'CLOSED':
      return <RoomClosedNotice expired={false} />;
    case 'EXPIRED':
      return <RoomClosedNotice expired />;
    default:
      return <WaitingRoomScreen />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 28,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.onPrimary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
