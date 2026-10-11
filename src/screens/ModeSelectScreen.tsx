import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { MultiplayerMode } from '../types';

export const ModeSelectScreen: React.FC = () => {
  const {
    activeRoom,
    profile,
    setRoomMode,
    startMultiplayerGame,
    leaveRoom,
  } = useApp();

  // Pure derived state from Firestore live snapshot
  const selectedMode: MultiplayerMode = activeRoom?.selectedMode || 'BOTH_TOGETHER';

  const isHost = activeRoom ? activeRoom.hostUid === profile.uid : false;
  const roomCode = activeRoom?.code || '------';
  const opponentName = isHost
    ? activeRoom?.guestName || 'Player 2'
    : activeRoom?.hostName || 'Host';

  const handleSelectMode = async (mode: MultiplayerMode) => {
    if (activeRoom) {
      await setRoomMode(mode);
    }
  };

  const handleConfirm = async () => {
    if (!activeRoom) return;
    if (!isHost) {
      Alert.alert(
        'Waiting for Host',
        'Only the room host can launch the match once the mode is selected.'
      );
      return;
    }
    await setRoomMode(selectedMode);
    await startMultiplayerGame();
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Lobby',
      'Are you sure you want to leave this room?',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: leaveRoom },
      ]
    );
  };

  const getModeTitle = (mode: MultiplayerMode) => {
    switch (mode) {
      case 'BOTH_TOGETHER':
        return 'Both Guess Together';
      case 'HOST_GUESSES':
        return 'Host Guesses';
      case 'FRIEND_GUESSES':
        return 'Friend Guesses';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleLeave}
          style={styles.leaveBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={16} color={COLORS.onSurface} />
          <Text style={styles.leaveBtnText}>LEAVE</Text>
        </TouchableOpacity>

        <View style={styles.roomPill}>
          <Text style={styles.roomPillText}>#{roomCode}</Text>
        </View>

        <View style={styles.syncedPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.syncedText}>LIVE SYNCED</Text>
        </View>
      </View>

      {/* Screen Title */}
      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>Select Match Mode</Text>
        <Text style={styles.screenSubtitle}>
          Mode selection syncs with {opponentName} in real-time.
        </Text>
      </View>

      {/* 3 Compact Mode Cards (Fit screen without scrolling!) */}
      <View style={styles.modesContainer}>
        {/* Mode 1: Both Together */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleSelectMode('BOTH_TOGETHER')}
          style={[
            styles.modeCard,
            selectedMode === 'BOTH_TOGETHER' && styles.modeCardSelected,
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconAndTitle}>
              <View
                style={[
                  styles.modeIconBox,
                  selectedMode === 'BOTH_TOGETHER' && styles.modeIconBoxActive,
                ]}
              >
                <Ionicons
                  name="people"
                  size={20}
                  color={selectedMode === 'BOTH_TOGETHER' ? COLORS.onPrimary : COLORS.secondary}
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.modeCardTitle,
                    selectedMode === 'BOTH_TOGETHER' && styles.modeCardTitleActive,
                  ]}
                >
                  Race Mode (Both Guess)
                </Text>
                <Text style={styles.modeCardTag}>POPULAR • SPEED RACE</Text>
              </View>
            </View>

            <View style={styles.radioOuter}>
              {selectedMode === 'BOTH_TOGETHER' && <View style={styles.radioInner} />}
            </View>
          </View>
          <Text style={styles.modeCardDesc}>
            Both players guess the same number in real-time. Highest speed & precision wins!
          </Text>
        </TouchableOpacity>

        {/* Mode 2: Host Guesses */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleSelectMode('HOST_GUESSES')}
          style={[
            styles.modeCard,
            selectedMode === 'HOST_GUESSES' && styles.modeCardSelected,
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconAndTitle}>
              <View
                style={[
                  styles.modeIconBox,
                  selectedMode === 'HOST_GUESSES' && styles.modeIconBoxActive,
                ]}
              >
                <Ionicons
                  name="key"
                  size={20}
                  color={selectedMode === 'HOST_GUESSES' ? COLORS.onPrimary : COLORS.primaryContainer}
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.modeCardTitle,
                    selectedMode === 'HOST_GUESSES' && styles.modeCardTitleActive,
                  ]}
                >
                  Host Guesses
                </Text>
                <Text style={styles.modeCardTag}>TURN-BASED DUEL</Text>
              </View>
            </View>

            <View style={styles.radioOuter}>
              {selectedMode === 'HOST_GUESSES' && <View style={styles.radioInner} />}
            </View>
          </View>
          <Text style={styles.modeCardDesc}>
            Host guesses the target number while friend watches clues and tracks attempts.
          </Text>
        </TouchableOpacity>

        {/* Mode 3: Friend Guesses */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleSelectMode('FRIEND_GUESSES')}
          style={[
            styles.modeCard,
            selectedMode === 'FRIEND_GUESSES' && styles.modeCardSelected,
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconAndTitle}>
              <View
                style={[
                  styles.modeIconBox,
                  selectedMode === 'FRIEND_GUESSES' && styles.modeIconBoxActive,
                ]}
              >
                <Ionicons
                  name="hardware-chip"
                  size={20}
                  color={selectedMode === 'FRIEND_GUESSES' ? COLORS.onPrimary : COLORS.secondary}
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.modeCardTitle,
                    selectedMode === 'FRIEND_GUESSES' && styles.modeCardTitleActive,
                  ]}
                >
                  Friend Guesses
                </Text>
                <Text style={styles.modeCardTag}>CHALLENGER STAGE</Text>
              </View>
            </View>

            <View style={styles.radioOuter}>
              {selectedMode === 'FRIEND_GUESSES' && <View style={styles.radioInner} />}
            </View>
          </View>
          <Text style={styles.modeCardDesc}>
            Friend guesses the target number while host watches clues and tracks attempts.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Synchronized Mode Indicator & Action Section */}
      <View style={styles.bottomSection}>
        <View style={styles.syncBanner}>
          <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
          <Text style={styles.syncBannerText}>
            Selected: <Text style={{ color: COLORS.primaryContainer, fontWeight: '900' }}>{getModeTitle(selectedMode)}</Text>
          </Text>
        </View>

        {isHost ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleConfirm}
            style={styles.launchBtn}
          >
            <Ionicons name="play" size={18} color={COLORS.onPrimary} />
            <Text style={styles.launchBtnText}>START MATCH</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.onPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingHostBanner}>
            <Ionicons name="hourglass-outline" size={18} color={COLORS.secondary} />
            <Text style={styles.waitingHostText}>
              MODE SYNCED • WAITING FOR HOST TO START
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.margin,
    justifyContent: 'space-between',
    paddingBottom: 28,
  },
  header: {
    height: 48,
    marginTop: Platform.OS === 'android' ? 24 : 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 4,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  leaveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  roomPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  roomPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  syncedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  syncedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 6,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  modesContainer: {
    gap: 10,
    marginVertical: 4,
  },
  modeCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    ...SHADOWS.card,
  },
  modeCardSelected: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconBoxActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  modeCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  modeCardTitleActive: {
    color: COLORS.primaryContainer,
  },
  modeCardTag: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  modeCardDesc: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    lineHeight: 15,
    marginLeft: 46,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryContainer,
  },
  bottomSection: {
    gap: 8,
    marginTop: 8,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  syncBannerText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
  },
  launchBtn: {
    width: '100%',
    height: 50,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  launchBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.onPrimary,
    letterSpacing: 0.8,
  },
  waitingHostBanner: {
    width: '100%',
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 166, 224, 0.25)',
  },
  waitingHostText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
});
