import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { DIFFICULTY_CONFIGS } from '../constants/gameRules';
import { Difficulty } from '../types';

interface StageConfig {
  id: Difficulty;
  stageNumber: number;
  name: string;
  stars: number;
  range: string;
  guesses: number;
  points: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const stageFromConfig = (
  id: Difficulty,
  stageNumber: number,
  color: string,
  icon: keyof typeof Ionicons.glyphMap
): StageConfig => {
  const config = DIFFICULTY_CONFIGS[id];
  return {
    id,
    stageNumber,
    name: config.label.toUpperCase(),
    stars: config.stars,
    range: `${config.min} – ${config.max}`,
    guesses: config.shields,
    points: config.baseScore,
    color,
    icon,
  };
};

export const DifficultySelectScreen: React.FC = () => {
  const { startSoloGame, profile, settings } = useApp();
  const [selected, setSelected] = useState<Difficulty>('medium');

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy') => {
    if (!settings.hapticsEnabled) return;
    if (Platform.OS !== 'web') {
      try {
        if (style === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        else if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch { }
    }
  };

  const stages: StageConfig[] = [
    stageFromConfig('easy', 1, '#10b981', 'sparkles'),
    stageFromConfig('medium', 2, COLORS.primaryContainer, 'game-controller'),
    stageFromConfig('hard', 3, COLORS.error, 'flame'),
  ];

  const currentStage = stages.find((s) => s.id === selected) || stages[1];

  const handleSelect = (diff: Difficulty) => {
    triggerHaptic('medium');
    setSelected(diff);
  };

  const handleStart = () => {
    triggerHaptic('heavy');
    startSoloGame(selected);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.replace(ROUTES.dashboard);
          }}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>SELECT STAGE</Text>
          <Text style={styles.headerSub}>Solo Guessing Challenge</Text>
        </View>

        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={15} color={COLORS.primaryContainer} />
          <Text style={styles.streakText}>{profile.stats.currentStreak} 🔥</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stage Selection Cards */}
        <View style={styles.stageList}>
          {stages.map((stg) => {
            const isSelected = selected === stg.id;
            return (
              <TouchableOpacity
                key={stg.id}
                activeOpacity={0.85}
                onPress={() => handleSelect(stg.id)}
                style={[
                  styles.stageCard,
                  isSelected && [styles.stageCardSelected, { borderColor: stg.color }],
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  {/* Stage Icon & Title */}
                  <View style={styles.cardLeft}>
                    <View style={[styles.stageIconBox, { backgroundColor: `${stg.color}18` }]}>
                      <Ionicons name={stg.icon} size={22} color={stg.color} />
                    </View>
                    <View>
                      <View style={styles.stageTitleRow}>
                        <Text style={styles.stageNumberText}>STAGE {stg.stageNumber}</Text>
                        <Text style={[styles.stageNameText, { color: stg.color }]}>
                          • {stg.name}
                        </Text>
                      </View>
                      {/* Star Rating */}
                      <View style={styles.starRow}>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < stg.stars ? 'star' : 'star-outline'}
                            size={13}
                            color={i < stg.stars ? '#f59e0b' : COLORS.outline}
                            style={{ marginRight: 2 }}
                          />
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Radio Selection Dot */}
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && { borderColor: stg.color, backgroundColor: stg.color },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </View>

                {/* Game Specs Pills */}
                <View style={styles.specsRow}>
                  <View style={styles.specPill}>
                    <Ionicons name="git-commit-outline" size={13} color={COLORS.secondary} />
                    <Text style={styles.specPillLabel}>Range:</Text>
                    <Text style={styles.specPillValue}>{stg.range}</Text>
                  </View>

                  <View style={styles.specPill}>
                    <Ionicons name="keypad-outline" size={13} color={COLORS.primaryContainer} />
                    <Text style={styles.specPillLabel}>Guesses:</Text>
                    <Text style={styles.specPillValue}>{stg.guesses}</Text>
                  </View>

                  <View style={styles.specPill}>
                    <Ionicons name="trophy-outline" size={13} color="#f59e0b" />
                    <Text style={styles.specPillLabel}>Reward:</Text>
                    <Text style={[styles.specPillValue, { color: '#f59e0b' }]}>+{stg.points}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Docked Launch Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleStart}
          style={[styles.startBtn, { backgroundColor: currentStage.color }]}
        >
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <Text style={styles.startBtnText}>
            PLAY STAGE {currentStage.stageNumber} • {currentStage.name}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryContainer,
  },
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 16,
    paddingBottom: 110,
  },
  stageList: {
    gap: 12,
  },
  stageCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
    overflow: 'hidden',
  },
  stageCardSelected: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageTitleRow: {

    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stageNumberText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  stageNameText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specPillLabel: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  specPillValue: {
    fontSize: 11,
    color: COLORS.onSurface,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.margin,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: RADIUS.full,
    gap: 8,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
