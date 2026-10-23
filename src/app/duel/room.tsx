import React from 'react';
import { Redirect, router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { WaitingRoomScreen } from '../../screens/WaitingRoomScreen';
import { ModeSelectScreen } from '../../screens/ModeSelectScreen';
import { LiveMultiplayerScreen } from '../../screens/LiveMultiplayerScreen';
import { MultiplayerResultScreen } from '../../screens/MultiplayerResultScreen';
import { ROUTES } from '../../lib/routes';
import { useLeaveGuard } from '../../lib/useLeaveGuard';

export default function DuelRoomRoute() {
  const { activeRoom, leaveRoom } = useApp();
  const inProgress = Boolean(
    activeRoom && activeRoom.status !== 'RESULT' && activeRoom.status !== 'EXPIRED'
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
    default:
      return <WaitingRoomScreen />;
  }
}
