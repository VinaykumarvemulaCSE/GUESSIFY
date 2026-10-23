import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { FirestoreService } from '../services/firestoreService';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

export const MultiplayerMenuScreen: React.FC = () => {
  const { createMultiplayerRoom, joinMultiplayerRoom, profile } = useApp();
  const { code: inviteCode } = useLocalSearchParams<{ code?: string }>();
  const invite = typeof inviteCode === 'string' ? inviteCode.toUpperCase().slice(0, 6) : '';
  const [joinModalVisible, setJoinModalVisible] = useState(invite.length === 6);
  const [roomCodeInput, setRoomCodeInput] = useState(invite);
  const [error, setError] = useState('');
  const tier = FirestoreService.calculateTier(profile.points);

  const handleCreate = async () => {
    await createMultiplayerRoom();
  };

  const handleConnect = async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code || code.length !== 6) {
      setError('Please enter a 6-character room code');
      return;
    }
    setError('');
    const res = await joinMultiplayerRoom(code);
    if (res.success) {
      setJoinModalVisible(false);
      setRoomCodeInput('');
    } else {
      setError(res.error || 'Room not found or game already started');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.replace(ROUTES.dashboard)}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
          <View style={styles.arenaPill}>
            <View style={styles.arenaDot} />
            <Text style={styles.arenaPillText}>GUESSIFY ARENA</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push(ROUTES.rules)}
          style={styles.iconBtn}
        >
          <Ionicons name="help-circle-outline" size={22} color={COLORS.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Screen Heading */}
        <View style={styles.headingSection}>
          <View style={styles.titleRow}>
            <Text style={styles.heroTitle}>Multiplayer</Text>
            <Ionicons name="flash-outline" size={26} color={COLORS.secondary} />
          </View>
          <Text style={styles.heroSubtitle}>
            Play with your friends online in real-time numeric duels.
          </Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconBox}>
              <Ionicons name="ribbon-outline" size={20} color={COLORS.primaryContainer} />
            </View>
            <View>
              <Text style={styles.statLabel}>RANK</Text>
              <Text style={[styles.statVal, { color: COLORS.primary }]}>{tier}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconBox}>
              <Ionicons name="analytics-outline" size={20} color={COLORS.secondary} />
            </View>
            <View>
              <Text style={styles.statLabel}>TOTAL RECORD</Text>
              <Text style={styles.statVal}>
                {profile.stats.wins}W - {profile.stats.losses}L
              </Text>
            </View>
          </View>
        </View>

        {/* Interactive Game Cards Stack */}
        <View style={styles.cardsStack}>
          {/* Card 1: Create Game */}
          <View style={styles.actionCard}>
            <View style={styles.ambientGlowAmber} />
            <View style={styles.cardTopRow}>
              <View style={[styles.cardLargeIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Ionicons name="game-controller" size={30} color={COLORS.primaryContainer} />
              </View>
              <View style={styles.lobbyPill}>
                <Ionicons name="flash" size={12} color={COLORS.primaryContainer} />
                <Text style={styles.lobbyPillText}>HOST LOBBY</Text>
              </View>
            </View>

            <Text style={styles.cardHeading}>Create Game</Text>
            <Text style={styles.cardDesc}>
              Generate a room code and invite your friend to a real-time number duel.
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleCreate}
              style={styles.primaryActionBtn}
            >
              <Text style={styles.primaryActionBtnText}>Create Room</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Card 2: Join Game */}
          <View style={styles.actionCard}>
            <View style={styles.ambientGlowCyan} />
            <View style={styles.cardTopRow}>
              <View style={[styles.cardLargeIcon, { backgroundColor: 'rgba(0, 166, 224, 0.15)' }]}>
                <Ionicons name="keypad" size={28} color={COLORS.secondary} />
              </View>
              <View style={[styles.lobbyPill, { backgroundColor: 'rgba(0, 166, 224, 0.15)' }]}>
                <Ionicons name="people" size={12} color={COLORS.secondary} />
                <Text style={[styles.lobbyPillText, { color: COLORS.secondary }]}>QUICK JOIN</Text>
              </View>
            </View>

            <Text style={styles.cardHeading}>Join Game</Text>
            <Text style={styles.cardDesc}>
              Enter your friend&apos;s room code to enter their active lobby instantly.
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setError('');
                setJoinModalVisible(true);
              }}
              style={styles.secondaryActionBtn}
            >
              <Ionicons name="key-outline" size={20} color={COLORS.secondary} />
              <Text style={styles.secondaryActionBtnText}>Enter Room Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Pulse Indicator */}
        <View style={styles.liveIndicator}>
          <View style={styles.pulseDotWrapper}>
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.liveText}>
            <Text style={{ fontWeight: '700', color: COLORS.onSurface }}>248 players</Text> guessing online now
          </Text>
        </View>
      </ScrollView>

      {/* Join Room Modal Sheet */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Room Code</Text>
              <TouchableOpacity
                onPress={() => setJoinModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Ask the host for their 6-digit lobby passcode.
            </Text>

            <View style={styles.inputBox}>
              <TextInput
                style={styles.pinInput}
                value={roomCodeInput}
                onChangeText={(t) => {
                  setRoomCodeInput(t.toUpperCase());
                  setError('');
                }}
                placeholder="ABCDEF"
                placeholderTextColor={COLORS.charcoalLight}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {error ? (
              <Text style={styles.errorMsg}>{error}</Text>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleConnect}
              style={styles.connectBtn}
            >
              <Text style={styles.connectBtnText}>Connect to Duel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 60,
    marginTop: 40,
    paddingHorizontal: SPACING.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arenaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  arenaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryContainer,
  },
  arenaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingBottom: 40,
  },
  headingSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  cardsStack: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    padding: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.card,
  },
  ambientGlowAmber: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  ambientGlowCyan: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 166, 224, 0.08)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardLargeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lobbyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  lobbyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryContainer,
    letterSpacing: 0.5,
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  primaryActionBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.amberGlow,
  },
  primaryActionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  secondaryActionBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    alignSelf: 'center',
  },
  pulseDotWrapper: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 24, 0.85)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalSheet: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
    paddingBottom: 40,
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  closeBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.md,
  },
  inputBox: {
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  pinInput: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.charcoal,
    textAlign: 'center',
    letterSpacing: 8,
  },
  errorMsg: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  connectBtn: {
    height: 50,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...SHADOWS.amberGlow,
  },
  connectBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
});
