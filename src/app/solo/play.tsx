import React from 'react';
import { Redirect, router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { SoloGameScreen } from '../../screens/SoloGameScreen';
import { ROUTES } from '../../lib/routes';
import { useLeaveGuard } from '../../lib/useLeaveGuard';

export default function SoloPlayRoute() {
  const { soloGame, surrenderSoloGame } = useApp();
  const isRunning = Boolean(soloGame && !soloGame.isGameOver && !soloGame.isWon);

  useLeaveGuard(isRunning, 'Abandon round?', 'Leaving now counts as a defeat.', () => {
    surrenderSoloGame();
    router.replace(ROUTES.dashboard);
  });

  if (!soloGame) return <Redirect href={ROUTES.difficulty} />;
  return <SoloGameScreen />;
}
