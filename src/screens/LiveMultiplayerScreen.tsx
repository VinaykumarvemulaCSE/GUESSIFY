
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { CustomNumpad } from '../components/common/CustomNumpad';
import { GuessResult } from '../types';

export const LiveMultiplayerScreen: React.FC = () => {
  const {
    activeRoom,
    profile,
    submitMultiplayerGuess,
    leaveRoom,
  } = useApp();

  const [currentInput, setCurrentInput] = useState('');
  const [outOfRangeError, setOutOfRangeError] = useState<string | null>(null);
  const feedScrollRef = useRef<ScrollView>(null);

  // Auto-scroll feed down whenever guesses arrive
  useEffect(() => {
    feedScrollRef.current?.scrollToEnd({ animated: true });
  }, [activeRoom?.guesses.length]);

  if (!activeRoom) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={leaveRoom}>
          <Text style={styles.backLink}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const myLastGuess = [...activeRoom.guesses].reverse().find((g) => g.uid === profile.uid);
  const lastResult: GuessResult | null = myLastGuess?.result ?? null;
  const lastGuessedNum = myLastGuess?.guessNumber;
  const isAwaitingReferee = Boolean(
    activeRoom.pendingGuess && activeRoom.pendingGuess.uid === profile.uid
  );
  const isMyTurn =
    activeRoom.status === 'PLAYING' &&
    activeRoom.currentTurnUid === profile.uid &&
    !isAwaitingReferee;

  const handleNum = (num: string) => {
    if (outOfRangeError) setOutOfRangeError(null);
    if (currentInput.length < 3) {
      setCurrentInput((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    if (outOfRangeError) setOutOfRangeError(null);
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  const handleExitPrompt = () => {
    Alert.alert(
      'Leave Match?',
      'Are you sure you want to exit? The room will be closed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave Match', style: 'destructive', onPress: leaveRoom },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!currentInput) return;
    const val = parseInt(currentInput, 10);
    if (isNaN(val) || val < 1 || val > 100) {
      Alert.alert('Out of Range!', 'Target number is between 1 and 100. Please enter a valid number.');
      return;
    }
    setOutOfRangeError(null);
    const res = await submitMultiplayerGuess(val);
    if (!res.ok) {
      Alert.alert('Guess not sent', res.error || 'Try again in a moment.');
      return;
    }
    setCurrentInput('');
  };

  const getModeLabel = () => {
    switch (activeRoom.selectedMode) {
      case 'BOTH_TOGETHER':
        return 'Race';
      case 'HOST_GUESSES':
        return 'Host Guesses';
      case 'FRIEND_GUESSES':
        return 'Friend Guesses';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with Exit */}
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={handleExitPrompt}
          style={styles.leaveBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={16} color={COLORS.onSurface} />
          <Text style={styles.leaveBtnText}>LEAVE</Text>
        </TouchableOpacity>

        <View style={styles.modePill}>
          <Ionicons name="game-controller" size={14} color={COLORS.primaryContainer} />
          <Text style={styles.modePillText}>{getModeLabel()}</Text>
        </View>

        {/* Room Code Badge */}
        <View style={styles.roomBadgePill}>
          <Ionicons name="key-outline" size={13} color={COLORS.secondary} />
          <Text style={styles.roomBadgeText}>#{activeRoom.code}</Text>
        </View>
      </View>

      {/* Turn Banner */}
      <View
        style={[
          styles.turnBanner,
          {
            backgroundColor: isMyTurn
              ? 'rgba(251, 191, 36, 0.15)'
              : 'rgba(123, 208, 255, 0.12)',
            borderColor: isMyTurn ? COLORS.primaryContainer : COLORS.secondary,
          },
        ]}
      >
        <Ionicons
          name={isMyTurn ? 'flash' : 'hourglass-outline'}
          size={18}
          color={isMyTurn ? COLORS.primaryContainer : COLORS.secondary}
        />
        <Text
          style={[
            styles.turnBannerText,
            { color: isMyTurn ? COLORS.primaryContainer : COLORS.secondary },
          ]}
        >
          {isMyTurn
            ? 'YOUR TURN — ENTER GUESS'
            : isAwaitingReferee
              ? 'GUESS SENT — SCORING...'
              : "OPPONENT'S TURN — AWAITING MOVE"}
        </Text>
      </View>

      {/* Tactical 4-Indication Feedback Bar */}
      {lastResult && lastGuessedNum !== undefined ? (
        <View
          style={[
            styles.feedbackBanner,
            lastResult === 'TOO_HIGH' && styles.feedbackTooHigh,
            lastResult === 'HIGH' && styles.feedbackHigh,
            lastResult === 'LOW' && styles.feedbackLow,
            lastResult === 'TOO_LOW' && styles.feedbackTooLow,
            lastResult === 'CORRECT' && styles.feedbackCorrect,
          ]}
        >
          <Ionicons
            name={
              lastResult === 'CORRECT'
                ? 'checkmark-circle'
                : lastResult === 'TOO_HIGH'
                  ? 'arrow-down-circle'
                  : lastResult === 'HIGH'
                    ? 'arrow-down'
                    : lastResult === 'LOW'
                      ? 'arrow-up'
                      : 'arrow-up-circle'
            }
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.feedbackBannerText}>
            {lastResult === 'CORRECT'
              ? `VICTORY! ${lastGuessedNum} IS THE SECRET NUMBER!`
              : lastResult === 'TOO_HIGH'
                ? `${lastGuessedNum} IS TOO HIGH! Aim much lower ↓↓`
                : lastResult === 'HIGH'
                  ? `${lastGuessedNum} IS HIGH! Close, aim lower ↓`
                  : lastResult === 'LOW'
                    ? `${lastGuessedNum} IS LOW! Close, aim higher ↑`
                    : `${lastGuessedNum} IS TOO LOW! Aim much higher ↑↑`}
          </Text>
        </View>
      ) : null}

      {/* Live Guess Feed */}
      <View style={styles.feedSection}>
        <View style={styles.feedHeaderRow}>
          <Text style={styles.feedHeader}>LIVE MATCH LOG</Text>
          <Text style={styles.feedCountText}>
            {activeRoom.guesses.length} {activeRoom.guesses.length === 1 ? 'Move' : 'Moves'}
          </Text>
        </View>
        <ScrollView
          ref={feedScrollRef}
          style={styles.feedScroll}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
        >
          {activeRoom.guesses.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Ionicons name="game-controller-outline" size={24} color={COLORS.outline} style={{ marginBottom: 6 }} />
              <Text style={styles.emptyFeedText}>
                No moves played yet. First guess sets the duel in motion!
              </Text>
            </View>
          ) : (
            activeRoom.guesses.map((g, idx) => {
              const isMe = g.uid === profile.uid;
              const moveNum = idx + 1;
              return (
                <View key={idx} style={[styles.guessRow, isMe && styles.guessRowMine]}>
                  <View style={styles.moveBadge}>
                    <Text style={styles.moveBadgeText}>#{moveNum}</Text>
                  </View>
                  <View style={styles.playerTag}>
                    <Ionicons
                      name={isMe ? 'person' : 'person-outline'}
                      size={12}
                      color={isMe ? COLORS.primaryContainer : COLORS.secondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.playerTagName,
                        { color: isMe ? COLORS.primaryContainer : COLORS.secondary },
                      ]}
                      numberOfLines={1}
                    >
                      {isMe ? 'You' : g.playerName}
                    </Text>
                  </View>
                  <View style={styles.guessValContainer}>
                    <Text style={styles.guessNumVal}>{g.guessNumber}</Text>
                  </View>
                  <View
                    style={[
                      styles.badgePill,
                      {
                        backgroundColor:
                          g.result === 'CORRECT'
                            ? 'rgba(52, 211, 153, 0.18)'
                            : g.result === 'TOO_HIGH'
                              ? 'rgba(255, 82, 82, 0.18)'
                              : g.result === 'HIGH'
                                ? 'rgba(251, 191, 36, 0.18)'
                                : g.result === 'LOW'
                                  ? 'rgba(123, 208, 255, 0.18)'
                                  : 'rgba(59, 130, 246, 0.18)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        g.result === 'CORRECT'
                          ? 'checkmark-circle'
                          : g.result === 'TOO_HIGH'
                            ? 'arrow-down-circle'
                            : g.result === 'HIGH'
                              ? 'arrow-down'
                              : g.result === 'LOW'
                                ? 'arrow-up'
                                : 'arrow-up-circle'
                      }
                      size={11}
                      color={
                        g.result === 'CORRECT'
                          ? '#10b981'
                          : g.result === 'TOO_HIGH'
                            ? '#ef4444'
                            : g.result === 'HIGH'
                              ? '#f59e0b'
                              : g.result === 'LOW'
                                ? '#0284c7'
                                : '#2563eb'
                      }
                      style={{ marginRight: 3 }}
                    />
                    <Text
                      style={[
                        styles.badgePillText,
                        {
                          color:
                            g.result === 'CORRECT'
                              ? '#10b981'
                              : g.result === 'TOO_HIGH'
                                ? '#ef4444'
                                : g.result === 'HIGH'
                                  ? '#b45309'
                                  : g.result === 'LOW'
                                    ? '#0369a1'
                                    : '#1d4ed8',
                        },
                      ]}
                    >
                      {g.result === 'CORRECT'
                        ? 'CORRECT'
                        : g.result === 'TOO_HIGH'
                          ? 'TOO HIGH'
                          : g.result === 'HIGH'
                            ? 'HIGH'
                            : g.result === 'LOW'
                              ? 'LOW'
                              : 'TOO LOW'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Input Display Box */}
      {isMyTurn ? (
        <View style={styles.inputArea}>
          {outOfRangeError && (
            <View style={styles.rangeErrorBanner}>
              <Ionicons name="warning" size={14} color="#ef4444" />
              <Text style={styles.rangeErrorText}>{outOfRangeError}</Text>
            </View>
          )}
          <View style={styles.inputBox}>
            <Text style={styles.inputNumText}>
              {currentInput || <Text style={{ opacity: 0.25 }}>?</Text>}
            </Text>
          </View>
          <CustomNumpad
            onNumberPress={handleNum}
            onDeletePress={handleDelete}
            onSubmitPress={handleSubmit}
            submitDisabled={!currentInput}
          />
        </View>
      ) : (
        <View style={styles.waitingArea}>
          <View style={styles.waitingDot} />
          <Text style={styles.waitingText}>
            {isAwaitingReferee
              ? 'Referee is scoring your guess...'
              : 'Waiting for opponent to submit guess...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingTop: 50,
    justifyContent: 'space-between',
  },
  backLink: {
    color: COLORS.primaryContainer,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.margin,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  leaveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: SPACING.margin,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
  },
  feedbackTooHigh: {
    backgroundColor: '#ff5252',
    borderColor: '#b91c1c',
  },
  feedbackHigh: {
    backgroundColor: '#f59e0b',
    borderColor: '#b45309',
  },
  feedbackLow: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  feedbackTooLow: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  feedbackCorrect: {
    backgroundColor: '#10b981',
    borderColor: '#047857',
  },
  feedbackBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  modePillText: {
    color: COLORS.primaryContainer,
    fontSize: 11,
    fontWeight: '800',
  },
  roomBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(123, 208, 255, 0.3)',
  },
  roomBadgeText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: SPACING.margin,
    marginTop: SPACING.sm,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
  },
  turnBannerText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  feedSection: {
    flex: 1,
    paddingHorizontal: SPACING.margin,
    marginTop: SPACING.sm,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  feedHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  feedCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryContainer,
  },
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    gap: 6,
    paddingBottom: 10,
  },
  emptyFeed: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyFeedText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    textAlign: 'center',
  },
  guessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  guessRowMine: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(184, 134, 11, 0.35)',
  },
  moveBadge: {
    width: 28,
    alignItems: 'center',
  },
  moveBadgeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '800',
  },
  playerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 78,
  },
  playerTagName: {
    fontSize: 12,
    fontWeight: '800',
  },
  guessValContainer: {
    flex: 1,
    alignItems: 'center',
  },
  guessNumVal: {
    color: COLORS.onSurface,
    fontSize: 17,
    fontWeight: '900',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  inputArea: {
    paddingBottom: 20,
  },
  inputBox: {
    alignSelf: 'center',
    width: 130,
    height: 60,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  inputNumText: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  waitingArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  waitingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.secondary,
    marginBottom: 12,
  },
  waitingText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '600',
  },
  simBtn: {
    marginTop: 12,
    padding: 8,
  },
  simBtnText: {
    color: COLORS.primaryContainer,
    fontSize: 12,
    fontWeight: '700',
  },
  rangeErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: 8,
  },
  rangeErrorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },
});
