import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { HINT_PENALTY, MAX_HINTS } from '../constants/gameRules';
import { GuessResult } from '../types';

export const SoloGameScreen: React.FC = () => {
  const {
    soloGame,
    submitSoloGuess,
    unlockHint,
    availableHints,
    surrenderSoloGame,
    navigateTo,
  } = useApp();

  const [currentInput, setCurrentInput] = useState<string>('');
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [lastGuessedNum, setLastGuessedNum] = useState<number | undefined>();
  const [hintModalVisible, setHintModalVisible] = useState<boolean>(false);
  const [outOfRangeModal, setOutOfRangeModal] = useState<number | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // Animations for high-voltage game feel
  const vaultShakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const impactScaleAnim = useRef(new Animated.Value(1)).current;
  const needleAnim = useRef(new Animated.Value(0.5)).current; // 0 to 1 position on range bar

  // Auto-scroll to gaming viewport whenever an attempt or input occurs
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [soloGame?.attempts.length, currentInput]);

  // Ambient pulsing loop for vault core
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  if (!soloGame) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No active game session found.</Text>
        <TouchableOpacity onPress={() => navigateTo('DASHBOARD')}>
          <Text style={styles.backLink}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate dynamic narrowing target window across all 4 indications
  let dynamicMin = soloGame.rangeMin;
  let dynamicMax = soloGame.rangeMax;

  soloGame.attempts.forEach((att) => {
    if ((att.result === 'TOO_LOW' || att.result === 'LOW') && att.guessNumber >= dynamicMin) {
      dynamicMin = att.guessNumber + 1;
    }
    if ((att.result === 'TOO_HIGH' || att.result === 'HIGH') && att.guessNumber <= dynamicMax) {
      dynamicMax = att.guessNumber - 1;
    }
  });

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'error' | 'success') => {
    if (Platform.OS !== 'web') {
      try {
        if (style === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        else if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (style === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        else if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch { }
    }
  };

  const triggerImpactFeedback = (isCorrect: boolean) => {
    if (isCorrect) {
      triggerHaptic('success');
    } else {
      triggerHaptic('error');
      Animated.sequence([
        Animated.timing(vaultShakeAnim, { toValue: 14, duration: 40, useNativeDriver: true }),
        Animated.timing(vaultShakeAnim, { toValue: -14, duration: 40, useNativeDriver: true }),
        Animated.timing(vaultShakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
        Animated.timing(vaultShakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
        Animated.timing(vaultShakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
    }

    Animated.sequence([
      Animated.timing(impactScaleAnim, { toValue: 1.15, duration: 80, useNativeDriver: true }),
      Animated.spring(impactScaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  const handleKeypadPress = (val: string) => {
    triggerHaptic('light');
    if (outOfRangeModal !== null) setOutOfRangeModal(null);
    if (currentInput.length < 4) {
      const nextInput = currentInput + val;
      setCurrentInput(nextInput);
    }
  };

  const handleBackspace = () => {
    triggerHaptic('medium');
    if (outOfRangeModal !== null) setOutOfRangeModal(null);
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    triggerHaptic('medium');
    if (outOfRangeModal !== null) setOutOfRangeModal(null);
    setCurrentInput('');
  };

  // Tactical Midpoint Bumper (Binary Search Helper for gamers!)
  const handleTacticalMidpoint = () => {
    triggerHaptic('medium');
    if (outOfRangeModal !== null) setOutOfRangeModal(null);
    const mid = Math.round((dynamicMin + dynamicMax) / 2);
    setCurrentInput(mid.toString());
  };

  const handleBumperOffset = (delta: number) => {
    triggerHaptic('light');
    const current = parseInt(currentInput, 10) || Math.round((dynamicMin + dynamicMax) / 2);
    const clamped = Math.max(soloGame.rangeMin, Math.min(soloGame.rangeMax, current + delta));
    setCurrentInput(clamped.toString());
  };

  const handleSubmit = () => {
    if (!currentInput) return;
    const guessVal = parseInt(currentInput, 10);

    // Reject out of range input with visual popup without consuming attempts!
    if (isNaN(guessVal) || guessVal < soloGame.rangeMin || guessVal > soloGame.rangeMax) {
      triggerHaptic('error');
      setOutOfRangeModal(isNaN(guessVal) ? null : guessVal);
      Animated.sequence([
        Animated.timing(vaultShakeAnim, { toValue: 14, duration: 40, useNativeDriver: true }),
        Animated.timing(vaultShakeAnim, { toValue: -14, duration: 40, useNativeDriver: true }),
        Animated.timing(vaultShakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
        Animated.timing(vaultShakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
        Animated.timing(vaultShakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
      return;
    }

    // Animate radar needle position
    const ratio = (guessVal - soloGame.rangeMin) / (soloGame.rangeMax - soloGame.rangeMin);
    Animated.spring(needleAnim, {
      toValue: Math.max(0, Math.min(1, ratio)),
      friction: 5,
      useNativeDriver: false,
    }).start();

    setLastGuessedNum(guessVal);
    const result = submitSoloGuess(guessVal);
    setLastResult(result);
    setCurrentInput('');

    triggerImpactFeedback(result === 'CORRECT');
  };

  const handleLeaveGame = () => {
    Alert.alert(
      'Leave Game?',
      'Are you sure you want to exit? Your game in progress will be abandoned.',
      [
        { text: 'Keep Playing', style: 'cancel' },
        {
          text: 'Leave Game',
          style: 'destructive',
          onPress: () => navigateTo('DASHBOARD'),
        },
      ]
    );
  };

  const handleSurrender = () => {
    Alert.alert(
      'Surrender Vault?',
      'Round will count as a defeat and the secret code will be revealed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Surrender', style: 'destructive', onPress: surrenderSoloGame },
      ]
    );
  };

  const maxAttempts = soloGame.maxAttempts || 10;
  const attemptsCount = soloGame.attempts.length;
  const shieldsLeft = Math.max(0, maxAttempts - attemptsCount);
  const hintsRemaining = MAX_HINTS - soloGame.hintsUsed;

  return (
    <View style={styles.container}>
      {/* Top Arcade Hud */}
      <View style={styles.hudBar}>
        <View style={styles.hudLeft}>
          <TouchableOpacity
            style={styles.leaveBtn}
            onPress={handleLeaveGame}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.onSurface} />
            <Text style={styles.leaveBtnText}>LEAVE</Text>
          </TouchableOpacity>

          <View style={styles.difficultyTag}>
            <View style={styles.hudPulseDot} />
            <Text style={styles.difficultyTagText}>
              {soloGame.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.hudRight}>
          <TouchableOpacity
            style={[styles.hintTriggerBtn, hintsRemaining === 0 && styles.hintDisabled]}
            onPress={() => {
              triggerHaptic('light');
              setHintModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="bulb" size={15} color={COLORS.primaryContainer} />
            <Text style={styles.hintTriggerText}>HINT ({hintsRemaining})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSurrender}
            style={styles.surrenderIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="flag-outline" size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
      >

        {/* Energy Shields Gauge (Health Bar) */}
        <View style={styles.shieldBarContainer}>
          <View style={styles.shieldLabelRow}>
            <View style={styles.shieldLeft}>
              <Ionicons name="shield" size={14} color={shieldsLeft <= 3 ? COLORS.error : COLORS.primaryContainer} />
              <Text style={styles.shieldLabel}>VAULT INTEGRITY SHIELDS</Text>
            </View>
            <Text
              style={[
                styles.shieldCountText,
                { color: shieldsLeft <= 3 ? COLORS.error : COLORS.primaryContainer },
              ]}
            >
              {shieldsLeft} / {maxAttempts}
            </Text>
          </View>
          <View style={styles.shieldNodesTrack}>
            {Array.from({ length: maxAttempts }).map((_, idx) => {
              const isSpent = idx < attemptsCount;
              const isCurrent = idx === attemptsCount;
              return (
                <View
                  key={idx}
                  style={[
                    styles.shieldNode,
                    isSpent && styles.shieldNodeSpent,
                    !isSpent && styles.shieldNodeActive,
                    isCurrent && styles.shieldNodeGlowing,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Clean Range Tracker */}
        <View style={styles.radarContainer}>
          <View style={styles.radarHeader}>
            <Text style={styles.radarLabel}>CURRENT RANGE</Text>
            <Text style={styles.radarCorridorText}>
              <Text style={{ color: COLORS.secondary, fontWeight: '900' }}>{dynamicMin}</Text>
              <Text style={{ color: COLORS.onSurfaceVariant }}>  to  </Text>
              <Text style={{ color: COLORS.primaryContainer, fontWeight: '900' }}>{dynamicMax}</Text>
            </Text>
          </View>
        </View>

        {/* Central Glowing Cyber Vault Reactor */}
        <Animated.View
          style={[
            styles.vaultChamber,
            { transform: [{ translateX: vaultShakeAnim }] },
          ]}
        >
          {/* Outer Orbital Glow Ring */}
          <Animated.View
            style={[
              styles.orbitalGlowRing,
              { transform: [{ scale: pulseAnim }] },
              lastResult === 'TOO_HIGH' && { backgroundColor: 'rgba(255, 82, 82, 0.16)' },
              lastResult === 'HIGH' && { backgroundColor: 'rgba(251, 191, 36, 0.16)' },
              lastResult === 'LOW' && { backgroundColor: 'rgba(123, 208, 255, 0.16)' },
              lastResult === 'TOO_LOW' && { backgroundColor: 'rgba(59, 130, 246, 0.16)' },
              lastResult === 'CORRECT' && { backgroundColor: 'rgba(52, 211, 153, 0.22)' },
            ]}
          />

          {/* Central Reactor Housing */}
          <View style={styles.reactorCore}>
            <View style={styles.reactorInnerBezel}>
              <Animated.View
                style={[
                  styles.reactorDisplay,
                  { transform: [{ scale: impactScaleAnim }] },
                ]}
              >
                {currentInput ? (
                  <Text style={styles.reactorNumberActive}>{currentInput}</Text>
                ) : (
                  <View style={styles.mysteryNumberBox}>
                    <Text style={styles.reactorQuestionMark}>?</Text>
                    <View style={styles.reactorScanLine} />
                  </View>
                )}
              </Animated.View>
            </View>
          </View>

          {/* Live Arcade Impact Feedback Banner with 4 Indications */}
          {lastResult && lastGuessedNum !== undefined ? (
            <View
              style={[
                styles.feedbackBanner,
                lastResult === 'TOO_HIGH' && styles.feedbackBannerTooHigh,
                lastResult === 'HIGH' && styles.feedbackBannerHigh,
                lastResult === 'LOW' && styles.feedbackBannerLow,
                lastResult === 'TOO_LOW' && styles.feedbackBannerTooLow,
                lastResult === 'CORRECT' && styles.feedbackBannerWin,
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
                size={20}
                color={
                  lastResult === 'CORRECT'
                    ? COLORS.onPrimary
                    : lastResult === 'TOO_HIGH'
                      ? '#ff5252'
                      : lastResult === 'HIGH'
                        ? '#fbbf24'
                        : lastResult === 'LOW'
                          ? '#7bd0ff'
                          : '#3b82f6'
                }
              />
              <Text
                style={[
                  styles.feedbackBannerText,
                  lastResult === 'CORRECT'
                    ? { color: COLORS.onPrimary }
                    : lastResult === 'TOO_HIGH'
                      ? { color: '#ff5252' }
                      : lastResult === 'HIGH'
                        ? { color: '#fbbf24' }
                        : lastResult === 'LOW'
                          ? { color: '#7bd0ff' }
                          : { color: '#3b82f6' },
                ]}
              >
                {lastResult === 'CORRECT'
                  ? `${lastGuessedNum} — CORRECT! YOU WON!`
                  : lastResult === 'TOO_HIGH'
                    ? `${lastGuessedNum} — WAY TOO HIGH ↓↓`
                    : lastResult === 'HIGH'
                      ? `${lastGuessedNum} — TOO HIGH ↓`
                      : lastResult === 'LOW'
                        ? `${lastGuessedNum} — TOO LOW ↑`
                        : `${lastGuessedNum} — WAY TOO LOW ↑↑`}
              </Text>
            </View>
          ) : (
            <View style={styles.idleHintBanner}>
              <Ionicons name="game-controller-outline" size={16} color={COLORS.primaryContainer} />
              <Text style={styles.idleHintText}>ENTER A NUMBER TO GUESS</Text>
            </View>
          )}

          {/* Recent Guesses History Track */}
          {soloGame.attempts.length > 0 && (
            <View style={styles.historyStrip}>
              <Text style={styles.historyLabel}>RECENT:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {soloGame.attempts.slice(-5).map((att) => {
                  const isHigh = att.result === 'TOO_HIGH' || att.result === 'HIGH';
                  const badgeColor =
                    att.result === 'CORRECT'
                      ? COLORS.primaryContainer
                      : att.result === 'TOO_HIGH'
                        ? '#ff5252'
                        : att.result === 'HIGH'
                          ? '#fbbf24'
                          : att.result === 'LOW'
                            ? '#7bd0ff'
                            : '#3b82f6';

                  return (
                    <View
                      key={att.id}
                      style={[
                        styles.historyBadge,
                        {
                          borderColor: `${badgeColor}80`,
                          backgroundColor: `${badgeColor}18`,
                        },
                      ]}
                    >
                      <Text style={[styles.historyBadgeText, { color: badgeColor }]}>
                        {att.guessNumber}
                      </Text>
                      <Ionicons
                        name={
                          att.result === 'CORRECT'
                            ? 'checkmark'
                            : isHigh
                              ? 'arrow-down'
                              : 'arrow-up'
                        }
                        size={10}
                        color={badgeColor}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* Quick Tactical Arcade Bumpers */}
        <View style={styles.bumpersRow}>
          <TouchableOpacity
            style={styles.bumperBtn}
            onPress={() => handleBumperOffset(-10)}
            activeOpacity={0.7}
          >
            <Text style={styles.bumperText}>-10</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bumperBtn}
            onPress={() => handleBumperOffset(-1)}
            activeOpacity={0.7}
          >
            <Text style={styles.bumperText}>-1</Text>
          </TouchableOpacity>

          {/* Tactical Midpoint Instant Calculation (Gamer Pro Move!) */}
          <TouchableOpacity
            style={styles.midpointBtn}
            onPress={handleTacticalMidpoint}
            activeOpacity={0.7}
          >
            <Ionicons name="scan-circle" size={16} color={COLORS.secondary} />
            <Text style={styles.midpointText}>MIDPOINT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bumperBtn}
            onPress={() => handleBumperOffset(1)}
            activeOpacity={0.7}
          >
            <Text style={styles.bumperText}>+1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bumperBtn}
            onPress={() => handleBumperOffset(10)}
            activeOpacity={0.7}
          >
            <Text style={styles.bumperText}>+10</Text>
          </TouchableOpacity>
        </View>

        {/* 3D Cyber-Deck Keypad */}
        <View style={styles.keypadDeck}>
          <View style={styles.keypadRow}>
            {['1', '2', '3'].map((n) => (
              <TouchableOpacity
                key={n}
                activeOpacity={0.65}
                style={styles.deckKey}
                onPress={() => handleKeypadPress(n)}
              >
                <Text style={styles.deckKeyText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {['4', '5', '6'].map((n) => (
              <TouchableOpacity
                key={n}
                activeOpacity={0.65}
                style={styles.deckKey}
                onPress={() => handleKeypadPress(n)}
              >
                <Text style={styles.deckKeyText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {['7', '8', '9'].map((n) => (
              <TouchableOpacity
                key={n}
                activeOpacity={0.65}
                style={styles.deckKey}
                onPress={() => handleKeypadPress(n)}
              >
                <Text style={styles.deckKeyText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity
              activeOpacity={0.65}
              style={[styles.deckKey, styles.deckKeyAction]}
              onPress={handleClear}
            >
              <Text style={styles.deckKeyActionText}>CLR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.65}
              style={styles.deckKey}
              onPress={() => handleKeypadPress('0')}
            >
              <Text style={styles.deckKeyText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.65}
              style={[styles.deckKey, styles.deckKeyAction]}
              onPress={handleBackspace}
            >
              <Ionicons name="backspace-outline" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Giant Glowing Launchpad Trigger */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!currentInput}
          onPress={handleSubmit}
          style={[
            styles.lockInBtn,
            !currentInput && styles.lockInBtnDisabled,
          ]}
        >
          <Ionicons
            name="flash"
            size={24}
            color={currentInput ? COLORS.surfaceContainerLowest : COLORS.onSurfaceVariant}
          />
          <Text
            style={[
              styles.lockInBtnText,
              !currentInput && { color: COLORS.onSurfaceVariant },
            ]}
          >
            {currentInput ? `LOCK IN GUESS [ ${currentInput} ]` : 'ENTER A NUMBER TO LOCK IN'}
          </Text>
          {currentInput ? (
            <Ionicons name="arrow-forward" size={22} color={COLORS.surfaceContainerLowest} />
          ) : null}
        </TouchableOpacity>
      </ScrollView>

      {/* Cyber Intelligence Hint Sheet */}
      <Modal
        visible={hintModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHintModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.hintModalIconBox}>
                  <Ionicons name="bulb" size={24} color={COLORS.primaryContainer} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>TACTICAL CLUES</Text>
                  <Text style={styles.modalSub}>{hintsRemaining} Intel Drops Remaining</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setHintModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.hintsList}>
              {availableHints.map((hint) => (
                <View key={hint.id} style={styles.hintItemCard}>
                  <View style={styles.hintItemHeader}>
                    <Text style={styles.hintItemTitle}>{hint.title}</Text>
                    <Text style={styles.hintItemPenalty}>-{HINT_PENALTY} PTS</Text>
                  </View>
                  <Text style={styles.hintItemDesc}>
                    {hint.unlocked ? hint.description : 'Decrypted algorithm intel hidden.'}
                  </Text>
                  {!hint.unlocked && (
                    <TouchableOpacity
                      style={styles.unlockHintBtn}
                      onPress={() => {
                        triggerHaptic('medium');
                        unlockHint(hint.id);
                      }}
                    >
                      <Ionicons name="lock-open-outline" size={16} color={COLORS.surfaceContainerLowest} />
                      <Text style={styles.unlockHintText}>DECRYPT CLUE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => setHintModalVisible(false)}
            >
              <Text style={styles.dismissBtnText}>RESUME COMBAT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Out of Range Pop-up Modal */}
      <Modal
        visible={outOfRangeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOutOfRangeModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.outOfRangePopupCard}>
            <View style={styles.popupIconCircle}>
              <Ionicons name="alert-circle" size={44} color={COLORS.error} />
            </View>
            <Text style={styles.popupTitle}>OUT OF RANGE!</Text>
            <Text style={styles.popupMessage}>
              {outOfRangeModal !== null ? (
                <>
                  Your guess <Text style={styles.outOfRangeGuessHighlight}>{outOfRangeModal}</Text> is outside this stage.{'\n\n'}
                </>
              ) : null}
              Please enter a number between{' '}
              <Text style={styles.rangeHighlight}>
                {soloGame.rangeMin} and {soloGame.rangeMax}
              </Text>.
            </Text>
            <TouchableOpacity
              style={styles.popupOkBtn}
              onPress={() => setOutOfRangeModal(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.popupOkText}>GOT IT</Text>
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
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginBottom: 12,
  },
  backLink: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryContainer,
  },
  hudBar: {
    height: 48,
    marginTop: Platform.OS === 'android' ? 24 : 36,
    paddingHorizontal: SPACING.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  difficultyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  hudPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryContainer,
  },
  difficultyTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  hudRangeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  hintDisabled: {
    opacity: 0.4,
  },
  hintTriggerText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryContainer,
  },
  surrenderIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 8,
    paddingBottom: 20,
  },
  shieldBarContainer: {
    marginBottom: 8,
  },
  shieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  shieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  shieldCountText: {
    fontSize: 11,
    fontWeight: '900',
  },
  shieldNodesTrack: {
    flexDirection: 'row',
    gap: 4,
  },
  shieldNode: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  shieldNodeActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  shieldNodeSpent: {
    backgroundColor: COLORS.surfaceContainerHighest,
    opacity: 0.25,
  },
  shieldNodeGlowing: {
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  radarContainer: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radarLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  radarCorridorText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  thermalTrack: {
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  coldZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  zoneText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
  },
  targetZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  targetZoneText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primaryContainer,
  },
  hotZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vaultChamber: {
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  orbitalGlowRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  reactorCore: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 3,
    borderColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  reactorInnerBezel: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  reactorDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactorNumberActive: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primaryFixed,
    letterSpacing: 2,
  },
  mysteryNumberBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactorQuestionMark: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.primaryContainer,
  },
  reactorScanLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.secondary,
    borderRadius: 1,
    marginTop: -3,
  },
  outOfRangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    marginBottom: 12,
  },
  outOfRangeBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
    letterSpacing: 0.5,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  feedbackBannerTooHigh: {
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
    borderWidth: 1,
    borderColor: '#ff5252',
  },
  feedbackBannerHigh: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  feedbackBannerLow: {
    backgroundColor: 'rgba(123, 208, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#7bd0ff',
  },
  feedbackBannerTooLow: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  feedbackBannerHot: {
    backgroundColor: 'rgba(255, 180, 171, 0.18)',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  feedbackBannerCold: {
    backgroundColor: 'rgba(0, 166, 224, 0.18)',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  feedbackBannerWin: {
    backgroundColor: COLORS.primaryContainer,
  },
  feedbackBannerText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  idleHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  idleHintText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  historyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  historyLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
    borderWidth: 1,
  },
  historyBadgeHot: {
    backgroundColor: 'rgba(255, 180, 171, 0.12)',
    borderColor: 'rgba(255, 180, 171, 0.3)',
  },
  historyBadgeCold: {
    backgroundColor: 'rgba(0, 166, 224, 0.12)',
    borderColor: 'rgba(0, 166, 224, 0.3)',
  },
  historyBadgeWin: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: COLORS.primaryContainer,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  bumpersRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  bumperBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bumperText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  midpointBtn: {
    flex: 2,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 166, 224, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 166, 224, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  midpointText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  keypadDeck: {
    gap: 6,
    marginBottom: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 6,
  },
  deckKey: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  deckKeyText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  deckKeyAction: {
    backgroundColor: COLORS.surfaceContainer,
  },
  deckKeyActionText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  lockInBtn: {
    width: '100%',
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  lockInBtnDisabled: {
    backgroundColor: COLORS.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  lockInBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.surfaceContainerLowest,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 24, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hintModalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.onSurface,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.primaryContainer,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  hintsList: {
    gap: 12,
    marginBottom: 20,
  },
  hintItemCard: {
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  hintItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hintItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  hintItemPenalty: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.error,
  },
  hintItemDesc: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 10,
  },
  unlockHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 10,
    borderRadius: 10,
  },
  unlockHintText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.surfaceContainerLowest,
    letterSpacing: 0.5,
  },
  dismissBtn: {
    height: 50,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: 1,
  },
  outOfRangePopupCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  popupIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.error,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  popupMessage: {
    fontSize: 14,
    color: COLORS.onSurface,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  outOfRangeGuessHighlight: {
    fontWeight: '900',
    color: COLORS.error,
    fontSize: 16,
  },
  rangeHighlight: {
    fontWeight: '900',
    color: COLORS.primaryContainer,
  },
  popupOkBtn: {
    backgroundColor: COLORS.primaryContainer,
    height: 48,
    borderRadius: RADIUS.full,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  popupOkText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
