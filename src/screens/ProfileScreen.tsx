import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';
import { FirestoreService } from '../services/firestoreService';

export const ProfileScreen: React.FC = () => {
  const { profile, updateDisplayName, logout, navigateTo } = useApp();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newNameInput, setNewNameInput] = useState(profile.displayName);
  const [isSaving, setIsSaving] = useState(false);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success') => {
    if (Platform.OS !== 'web') {
      try {
        if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (style === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        else if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  const handleSaveName = async () => {
    const trimmed = newNameInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid Name', 'Display name cannot be empty.');
      return;
    }
    setIsSaving(true);
    triggerHaptic('success');
    await updateDisplayName(trimmed);
    setIsSaving(false);
    setEditModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          triggerHaptic('medium');
          logout();
        },
      },
    ]);
  };

  const tier = FirestoreService.calculateTier(profile.points);

  const badges = [
    {
      id: 'first_blood',
      title: 'First Blood',
      desc: 'First Vault Victory',
      icon: 'medal' as const,
      color: COLORS.primaryContainer,
      unlocked: profile.stats.wins >= 1,
    },
    {
      id: 'sharpshooter',
      title: 'Sharpshooter',
      desc: 'High Accuracy',
      icon: 'locate' as const,
      color: COLORS.secondary,
      unlocked: profile.stats.gamesPlayed >= 1 && profile.stats.winRate >= 50,
    },
    {
      id: 'streak_master',
      title: 'Streak Master',
      desc: '3+ Win Heat',
      icon: 'flame' as const,
      color: COLORS.error,
      unlocked: profile.stats.bestStreak >= 3,
    },
    {
      id: 'high_roller',
      title: 'High Roller',
      desc: 'Points Pioneer',
      icon: 'diamond' as const,
      color: COLORS.tertiaryContainer,
      unlocked: profile.points >= 500,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            navigateTo('DASHBOARD');
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            navigateTo('SETTINGS');
          }}
          style={styles.backBtn}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <GlowCard variant="glowAmber" style={styles.avatarCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {(profile.displayName || 'P').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.avatarMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.playerName} numberOfLines={1}>{profile.displayName}</Text>
                <TouchableOpacity
                  style={styles.pencilBtn}
                  onPress={() => {
                    setNewNameInput(profile.displayName);
                    setEditModalVisible(true);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pencil" size={14} color={COLORS.primaryContainer} />
                </TouchableOpacity>
              </View>
              <Text style={styles.playerEmail} numberOfLines={1}>
                {profile.isGuest ? 'Guest Player' : profile.email}
              </Text>
              <View style={styles.tierPill}>
                <Ionicons name="shield-checkmark" size={12} color={COLORS.primaryContainer} />
                <Text style={styles.tierText}>
                  {tier.toUpperCase()} • {profile.points.toLocaleString()} PTS
                </Text>
              </View>
            </View>
          </View>
        </GlowCard>

        {/* Career Stats Grid (Responsive 2x2) */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>CAREER STATS</Text>
          <View style={styles.liveSyncBadge}>
            <Ionicons name="cloud-done-outline" size={12} color={COLORS.success} />
            <Text style={styles.liveSyncText}>Synced</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Ionicons name="game-controller" size={16} color={COLORS.primaryContainer} />
              <Text style={styles.statCardLabel}>PLAYED</Text>
            </View>
            <Text style={styles.statCardVal}>{profile.stats.gamesPlayed}</Text>
            <Text style={styles.statCardSub}>{profile.stats.wins} wins • {profile.stats.losses} lost</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Ionicons name="trending-up" size={16} color={COLORS.secondary} />
              <Text style={styles.statCardLabel}>WIN RATE</Text>
            </View>
            <Text style={[styles.statCardVal, { color: COLORS.secondary }]}>
              {profile.stats.winRate}%
            </Text>
            <Text style={styles.statCardSub}>Accuracy</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Ionicons name="flame" size={16} color={COLORS.error} />
              <Text style={styles.statCardLabel}>STREAK</Text>
            </View>
            <Text style={[styles.statCardVal, { color: COLORS.error }]}>
              {profile.stats.currentStreak} 🔥
            </Text>
            <Text style={styles.statCardSub}>Best: {profile.stats.bestStreak}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Ionicons name="trophy" size={16} color={COLORS.primaryContainer} />
              <Text style={styles.statCardLabel}>HIGH SCORE</Text>
            </View>
            <Text style={[styles.statCardVal, { color: COLORS.primaryContainer }]}>
              {profile.stats.highScore.toLocaleString()}
            </Text>
            <Text style={styles.statCardSub}>Single game peak</Text>
          </View>
        </View>

        {/* Medals & Achievements */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
          <Text style={styles.medalsCount}>
            {badges.filter((b) => b.unlocked).length} / {badges.length}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
          {badges.map((b) => (
            <View
              key={b.id}
              style={[
                styles.badgeCard,
                !b.unlocked && styles.badgeLockedCard,
              ]}
            >
              <View
                style={[
                  styles.badgeIconCircle,
                  { backgroundColor: b.unlocked ? `${b.color}25` : 'rgba(0, 0, 0, 0.05)' },
                ]}
              >
                <Ionicons
                  name={b.icon}
                  size={22}
                  color={b.unlocked ? b.color : COLORS.onSurfaceVariant}
                />
              </View>
              <Text
                style={[
                  styles.badgeCardTitle,
                  !b.unlocked && { color: COLORS.onSurfaceVariant },
                ]}
              >
                {b.title}
              </Text>
              <Text style={styles.badgeCardSub}>
                {b.unlocked ? b.desc : 'Locked'}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Quick Menu Options */}
        <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 8 }]}>QUICK NAVIGATION</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigateTo('HISTORY')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconBox}>
              <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
            </View>
            <View>
              <Text style={styles.menuTitle}>My Match History</Text>
              <Text style={styles.menuSub}>View past games and stats</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigateTo('LEADERBOARD')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconBox}>
              <Ionicons name="trophy-outline" size={20} color={COLORS.primaryContainer} />
            </View>
            <View>
              <Text style={styles.menuTitle}>Global Leaderboard</Text>
              <Text style={styles.menuSub}>Rankings and standings</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigateTo('SETTINGS')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconBox}>
              <Ionicons name="settings-outline" size={20} color={COLORS.onSurfaceVariant} />
            </View>
            <View>
              <Text style={styles.menuTitle}>Settings</Text>
              <Text style={styles.menuSub}>Sound, vibration and rules</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Display Name Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>EDIT DISPLAY NAME</Text>
            <Text style={styles.modalSub}>
              Enter your preferred name for matches and leaderboard.
            </Text>

            <TextInput
              style={styles.textInput}
              value={newNameInput}
              onChangeText={setNewNameInput}
              placeholder="Enter name..."
              placeholderTextColor={COLORS.charcoalLight}
              maxLength={20}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, isSaving && { opacity: 0.6 }]}
                disabled={isSaving}
                onPress={handleSaveName}
              >
                <Text style={styles.modalSaveText}>
                  {isSaving ? 'SAVING...' : 'CONFIRM HANDLE'}
                </Text>
              </TouchableOpacity>
            </View>
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
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: 2,
  },
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 16,
    paddingBottom: 110,
  },
  avatarCard: {
    padding: 16,
    marginBottom: 20,
    borderRadius: RADIUS.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryContainer,
    letterSpacing: 1,
  },
  avatarMeta: {
    flex: 1,
    minWidth: 0,
  },
  pencilBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  playerEmail: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
    fontWeight: '500',
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  tierPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryContainer,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primaryFixed,
    letterSpacing: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveSyncText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  medalsCount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryContainer,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  statCardVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  statCardSub: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  badgesScroll: {
    marginBottom: 16,
  },
  badgeCard: {
    width: 120,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  badgeLockedCard: {
    opacity: 0.45,
  },
  badgeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeCardSub: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  menuSub: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginTop: 16,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.error,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 24, 0.85)',
    justifyContent: 'center',
    padding: SPACING.margin,
  },
  modalCard: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginBottom: 16,
    lineHeight: 18,
  },
  textInput: {
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.charcoal,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
  },
  modalSaveBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.surfaceContainerLowest,
  },
});
