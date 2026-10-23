import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';

export const WaitingRoomScreen: React.FC = () => {
  const { activeRoom, profile, leaveRoom, startMultiplayerGame } = useApp();
  const [copied, setCopied] = useState(false);

  if (!activeRoom) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.replace(ROUTES.dashboard)}>
          <Text style={styles.backLink}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isHost = activeRoom.hostUid === profile.uid;
  const isOpponentJoined = Boolean(activeRoom.guestUid);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Guessify 1v1 Number Duel! Room Code: ${activeRoom.code}`,
      });
    } catch {}
  };

  const handleStartGame = async () => {
    if (!isHost) return;

    if (!isOpponentJoined) {
      Alert.alert(
        'Waiting for Friend',
        'Share your room code with your friend. The duel will unlock as soon as your friend joins the room.'
      );
      return;
    }

    try {
      await startMultiplayerGame();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not start game.');
    }
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleLeave}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>1v1 DUEL LOBBY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Room Code Card */}
        <GlowCard variant="glowAmber" style={styles.codeCard}>
          <Text style={styles.codeLabel}>SHARE THIS ROOM CODE</Text>
          <View style={styles.codeDisplayRow}>
            <Text style={styles.codeText}>{activeRoom.code}</Text>
          </View>

          <View style={styles.codeActionRow}>
            <TouchableOpacity
              onPress={handleCopy}
              style={styles.codeActionBtn}
              activeOpacity={0.8}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={16}
                color={copied ? COLORS.success : COLORS.primaryContainer}
              />
              <Text
                style={[
                  styles.codeActionText,
                  copied && { color: COLORS.success },
                ]}
              >
                {copied ? 'COPIED!' : 'COPY CODE'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={[styles.codeActionBtn, styles.shareBtn]}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
              <Text style={[styles.codeActionText, { color: '#FFFFFF' }]}>SHARE</Text>
            </TouchableOpacity>
          </View>
        </GlowCard>

        {/* Players Status Section */}
        <Text style={styles.sectionTitle}>PLAYERS IN LOBBY</Text>

        <View style={styles.playersList}>
          {/* Player 1 (Host) */}
          <View style={styles.playerCard}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerAvatarText}>
                {(activeRoom.hostName || 'P1').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.playerMeta}>
              <View style={styles.playerNameRow}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {activeRoom.hostName}
                </Text>
                <View style={styles.hostBadge}>
                  <Text style={styles.hostBadgeText}>HOST</Text>
                </View>
              </View>
              <Text style={styles.playerRoleText}>Player 1</Text>
            </View>
            <View style={styles.statusPillReady}>
              <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
              <Text style={styles.statusPillReadyText}>READY</Text>
            </View>
          </View>

          {/* VS Divider */}
          <View style={styles.vsRow}>
            <View style={styles.vsLine} />
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsLine} />
          </View>

          {/* Player 2 (Opponent) */}
          {isOpponentJoined ? (
            <View style={styles.playerCard}>
              <View style={[styles.playerAvatar, { borderColor: COLORS.secondary }]}>
                <Text style={[styles.playerAvatarText, { color: COLORS.secondary }]}>
                  {(activeRoom.guestName || 'P2').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.playerMeta}>
                <View style={styles.playerNameRow}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {activeRoom.guestName}
                  </Text>
                  <View style={[styles.hostBadge, { backgroundColor: 'rgba(2, 132, 199, 0.15)' }]}>
                    <Text style={[styles.hostBadgeText, { color: COLORS.secondary }]}>CHALLENGER</Text>
                  </View>
                </View>
                <Text style={styles.playerRoleText}>Player 2</Text>
              </View>
              <View style={styles.statusPillReady}>
                <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                <Text style={styles.statusPillReadyText}>JOINED</Text>
              </View>
            </View>
          ) : (
            <View style={styles.waitingPlayerCard}>
              <View style={styles.waitingAvatar}>
                <Ionicons name="hourglass-outline" size={24} color={COLORS.onSurfaceVariant} />
              </View>
              <View style={styles.playerMeta}>
                <Text style={styles.waitingPlayerName}>Waiting for Player 2...</Text>
                <Text style={styles.waitingPlayerSub}>
                  Enter code {activeRoom.code} on another device
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Real Rules Intel */}
        <View style={styles.rulesCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.secondary} />
          <Text style={styles.rulesText}>
            Secret number is 1 to 100. Both players take turns to guess. First to crack the target wins!
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.actionSection}>
          {isHost ? (
            <TouchableOpacity
              activeOpacity={isOpponentJoined ? 0.88 : 1}
              onPress={handleStartGame}
              style={[
                styles.startBtn,
                !isOpponentJoined && styles.startBtnDisabled,
              ]}
            >
              <Ionicons
                name={isOpponentJoined ? 'play' : 'hourglass-outline'}
                size={20}
                color={isOpponentJoined ? '#FFFFFF' : COLORS.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.startBtnText,
                  !isOpponentJoined && styles.startBtnTextDisabled,
                ]}
              >
                {isOpponentJoined ? 'START 1v1 DUEL' : 'WAITING FOR OPPONENT TO JOIN...'}
              </Text>
              {isOpponentJoined && (
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.guestWaitingBox}>
              <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
              <Text style={styles.guestWaitingText}>
                CONNECTED! WAITING FOR HOST TO START...
              </Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLeave}
            style={styles.leaveBtn}
          >
            <Ionicons name="close-circle-outline" size={18} color={COLORS.error} />
            <Text style={styles.leaveBtnText}>LEAVE ROOM</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  backLink: {
    color: COLORS.primaryContainer,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 80,
  },
  header: {
    height: 48,
    marginTop: Platform.OS === 'android' ? 24 : 36,
    paddingHorizontal: SPACING.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: 1.5,
  },
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 10,
    paddingBottom: 24,
  },
  codeCard: {
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  codeDisplayRow: {
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    marginBottom: 10,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primaryContainer,
    letterSpacing: 5,
  },
  codeActionRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  codeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  shareBtn: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primaryContainer,
  },
  codeActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryContainer,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  playersList: {
    gap: 8,
    marginBottom: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    marginRight: 12,
  },
  playerAvatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryContainer,
  },
  playerMeta: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  hostBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hostBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primaryContainer,
  },
  playerRoleText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  statusPillReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusPillReadyText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.success,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 4,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  waitingPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  waitingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  waitingPlayerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  waitingPlayerSub: {
    fontSize: 11,
    color: COLORS.outline,
    marginTop: 2,
  },
  rulesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  rulesText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    lineHeight: 15,
    flex: 1,
  },
  actionSection: {
    gap: 8,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    gap: 8,
  },
  startBtnDisabled: {
    backgroundColor: COLORS.surfaceContainerHigh,
    opacity: 0.6,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  startBtnTextDisabled: {
    color: COLORS.onSurfaceVariant,
  },
  guestWaitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    gap: 8,
  },
  guestWaitingText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 6,
  },
  leaveBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.error,
    letterSpacing: 0.8,
  },
});
