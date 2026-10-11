import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, BackHandler, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp, ScreenName } from './src/context/AppContext';
import { COLORS } from './src/constants/theme';

// Screen Imports
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DifficultySelectScreen } from './src/screens/DifficultySelectScreen';
import { SoloGameScreen } from './src/screens/SoloGameScreen';
import { SoloResultScreen } from './src/screens/SoloResultScreen';
import { GameOverScreen } from './src/screens/GameOverScreen';
import { MultiplayerMenuScreen } from './src/screens/MultiplayerMenuScreen';
import { WaitingRoomScreen } from './src/screens/WaitingRoomScreen';
import { ModeSelectScreen } from './src/screens/ModeSelectScreen';
import { LiveMultiplayerScreen } from './src/screens/LiveMultiplayerScreen';
import { MultiplayerResultScreen } from './src/screens/MultiplayerResultScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { GameRulesScreen } from './src/screens/GameRulesScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { GameBottomNav } from './src/components/common/GameBottomNav';

const SHOW_BOTTOM_NAV_SCREENS: ScreenName[] = ['DASHBOARD', 'LEADERBOARD', 'HISTORY', 'PROFILE', 'SETTINGS'];

const RootNavigator: React.FC = () => {
  const { currentScreen, goBack, navigateTo, surrenderSoloGame, leaveRoom } = useApp();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const onBackPress = () => {
      if (currentScreen === 'SPLASH') {
        return true;
      }

      if (currentScreen === 'DASHBOARD') {
        Alert.alert('Exit Guessify', 'Are you sure you want to exit the game?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }

      if (currentScreen === 'SOLO_GAME') {
        Alert.alert('Abandon Round', 'Are you sure you want to leave this game? The round will count as a surrender.', [
          { text: 'Continue Playing', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              surrenderSoloGame();
              navigateTo('DASHBOARD');
            },
          },
        ]);
        return true;
      }

      if (currentScreen === 'WAITING_ROOM' || currentScreen === 'LIVE_MULTIPLAYER') {
        Alert.alert('Leave Room', 'Are you sure you want to leave the multiplayer room?', [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              leaveRoom();
              navigateTo('DASHBOARD');
            },
          },
        ]);
        return true;
      }

      if (SHOW_BOTTOM_NAV_SCREENS.includes(currentScreen)) {
        navigateTo('DASHBOARD');
        return true;
      }

      goBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SPLASH':
        return <SplashScreen />;
      case 'ONBOARDING':
        return <OnboardingScreen />;
      case 'LOGIN':
        return <LoginScreen />;
      case 'SIGNUP':
        return <SignUpScreen />;
      case 'FORGOT_PASSWORD':
        return <ForgotPasswordScreen />;
      case 'DASHBOARD':
        return <DashboardScreen />;
      case 'PROFILE':
        return <ProfileScreen />;
      case 'DIFFICULTY_SELECT':
        return <DifficultySelectScreen />;
      case 'SOLO_GAME':
        return <SoloGameScreen />;
      case 'SOLO_RESULT':
        return <SoloResultScreen />;
      case 'GAME_OVER':
        return <GameOverScreen />;
      case 'MULTIPLAYER_MENU':
        return <MultiplayerMenuScreen />;
      case 'WAITING_ROOM':
        return <WaitingRoomScreen />;
      case 'MODE_SELECTION':
        return <ModeSelectScreen />;
      case 'LIVE_MULTIPLAYER':
        return <LiveMultiplayerScreen />;
      case 'MULTIPLAYER_RESULT':
        return <MultiplayerResultScreen />;
      case 'LEADERBOARD':
        return <LeaderboardScreen />;
      case 'HISTORY':
        return <HistoryScreen />;
      case 'SETTINGS':
        return <SettingsScreen />;
      case 'RULES':
        return <GameRulesScreen />;
      case 'ABOUT':
        return <AboutScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {renderScreen()}
      {SHOW_BOTTOM_NAV_SCREENS.includes(currentScreen) && <GameBottomNav />}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <SafeAreaView style={styles.safeArea}>
          <RootNavigator />
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

  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
});
