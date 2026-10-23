import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { ROUTES } from '../../lib/routes';

/** Deep link entry: guessify://duel/ABC123 → /duel?code=ABC123 */
export default function DuelJoinRoute() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  return <Redirect href={{ pathname: ROUTES.duel, params: { code: code ?? '' } }} />;
}
