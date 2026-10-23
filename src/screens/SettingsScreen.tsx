import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../lib/routes';
import { PRIVACY_URL } from '../constants/links';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';

export const SettingsScreen: React.FC = () => {
  const {
    profile,
    settings,
    updateSettings,
    clearMatchHistory,
    logout,
    deleteAccount,
    setLeaderboardHidden,
    pendingSync,
  } = useApp();

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Match History',
      'Are you sure you want to clear your match history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearMatchHistory();
              Alert.alert('History Cleared', 'Your local match history has been reset.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not clear history.');
            }
          },
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const res = await deleteAccount(profile.isGuest ? undefined : deletePassword);
    setDeleting(false);
    if (res.success) {
      setDeleteVisible(false);
      setDeletePassword('');
    } else {
      Alert.alert('Could not delete account', res.error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, history, leaderboard entries and sign-in. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (profile.isGuest) void confirmDelete();
            else setDeleteVisible(true);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      profile.isGuest ? 'Exit Guest Session' : 'Sign Out',
      profile.isGuest
        ? 'Your guest progress will remain on this device.'
        : 'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: profile.isGuest ? 'Exit' : 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace(ROUTES.dashboard)}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Compact Account Card */}
        <GlowCard variant="glowAmber" style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>
                {(profile.displayName || 'P').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName} numberOfLines={1}>
                {profile.displayName}
              </Text>
              <Text style={styles.accountEmail} numberOfLines={1}>
                {profile.isGuest ? 'Guest Player' : profile.email}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileLinkBtn}
              onPress={() => router.push(ROUTES.profile)}
              activeOpacity={0.7}
            >
              <Text style={styles.profileLinkText}>View Profile</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primaryContainer} />
            </TouchableOpacity>
          </View>
        </GlowCard>

        {/* Sensory Toggles */}
        <Text style={styles.sectionHeader}>SENSORY & CONTROLS</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.12)' }]}>
                <Ionicons name="volume-high-outline" size={18} color={COLORS.primaryContainer} />
              </View>
              <View style={styles.settingMeta}>
                <Text style={styles.settingTitle}>Sound Effects</Text>
                <Text style={styles.settingSub}>Audio feedback for guesses, hints & victory</Text>
              </View>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(val) => updateSettings({ soundEnabled: val })}
              trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.primaryContainer }}
              thumbColor={COLORS.onSurface}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                <Ionicons name="phone-portrait-outline" size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.settingMeta}>
                <Text style={styles.settingTitle}>Haptic Feedback</Text>
                <Text style={styles.settingSub}>Vibrate device on guess submission</Text>
              </View>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(val) => updateSettings({ hapticsEnabled: val })}
              trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.secondary }}
              thumbColor={COLORS.onSurface}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                <Ionicons name="keypad-outline" size={18} color={COLORS.tertiaryContainer} />
              </View>
              <View style={styles.settingMeta}>
                <Text style={styles.settingTitle}>Keypad Tactile Click</Text>
                <Text style={styles.settingSub}>Micro-vibration on numeric keypad</Text>
              </View>
            </View>
            <Switch
              value={settings.keypadVibration}
              onValueChange={(val) => updateSettings({ keypadVibration: val })}
              trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.tertiaryContainer }}
              thumbColor={COLORS.onSurface}
            />
          </View>
        </View>

        {/* Match History & Data Management */}
        <Text style={styles.sectionHeader}>DATA & STORAGE</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
                <Ionicons name="trophy-outline" size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.settingMeta}>
                <Text style={styles.settingTitle}>Show Me on Leaderboards</Text>
                <Text style={styles.settingSub}>
                  {profile.hideFromLeaderboard
                    ? 'Hidden - your entries stay private'
                    : 'Visible to other players'}
                </Text>
              </View>
            </View>
            <Switch
              value={!profile.hideFromLeaderboard}
              onValueChange={(visible) => setLeaderboardHidden(!visible)}
              trackColor={{ false: COLORS.surfaceContainerHigh, true: COLORS.secondary }}
              thumbColor={COLORS.onSurface}
            />
          </View>

          {pendingSync > 0 && (
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconBox, { backgroundColor: 'rgba(251, 191, 36, 0.12)' }]}>
                  <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primaryContainer} />
                </View>
                <View style={styles.settingMeta}>
                  <Text style={styles.settingTitle}>
                    {pendingSync} result{pendingSync === 1 ? '' : 's'} waiting to sync
                  </Text>
                  <Text style={styles.settingSub}>Uploads automatically when you are online</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.settingItemAction}
            onPress={handleClearHistory}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </View>
              <View style={styles.settingMeta}>
                <Text style={[styles.settingTitle, { color: COLORS.error }]}>Clear Match History</Text>
                <Text style={styles.settingSub}>Reset your local solo and match records</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Knowledge & Info */}
        <Text style={styles.sectionHeader}>RULES & INFO</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => router.push(ROUTES.rules)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                <Ionicons name="book-outline" size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.settingMeta}>
                <Text style={styles.settingTitle}>Game Rules & Scoring</Text>
                <Text style={styles.settingSub}>Point formulas, streaks & hint costs</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => Linking.openURL(PRIVACY_URL)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(148, 163, 184, 0.14)' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.onSurfaceVariant} />
              </View>
              <View style={styles.settingMeta}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingSub}>What Guessify stores and why</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navRow, { borderBottomWidth: 0 }]}
            onPress={() => router.push(ROUTES.about)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.12)' }]}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.primaryContainer} />
              </View>
              <View style={styles.settingMeta}>
                <Text style={styles.settingTitle}>About Guessify</Text>
                <Text style={styles.settingSub}>Version 1.0 • Nostalgic Guessing Game</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Account Controls */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>
            {profile.isGuest ? 'EXIT GUEST SESSION' : 'SIGN OUT'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
        >
          <Ionicons name="person-remove-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>DELETE ACCOUNT</Text>
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          Deleting removes your profile, match history and leaderboard entries. You can also request
          deletion from the web page linked in the Privacy Policy.
        </Text>
      </ScrollView>

      <Modal
        visible={deleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm deletion</Text>
            <Text style={styles.modalSub}>
              Enter your password to permanently delete {profile.email}.
            </Text>
            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Password"
              placeholderTextColor={COLORS.outline}
              secureTextEntry
              style={styles.modalInput}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.modalConfirm, deleting && { opacity: 0.5 }]}
              disabled={deleting || deletePassword.length < 6}
              onPress={confirmDelete}
            >
              <Text style={styles.modalConfirmText}>
                {deleting ? 'DELETING...' : 'DELETE MY ACCOUNT'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleteVisible(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
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
  accountCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryContainer,
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: 0.3,
  },
  accountEmail: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
    fontWeight: '500',
  },
  profileLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  profileLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryContainer,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 8,
  },
  settingsGroup: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  settingItemAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingMeta: {
    flex: 1,
  },
  settingTitle: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '800',
  },
  settingSub: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginTop: 24,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: RADIUS.full,
    marginTop: 10,
  },
  legalNote: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.onSurface,
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.onSurfaceVariant,
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    color: COLORS.onSurface,
    marginBottom: 14,
  },
  modalConfirm: {
    height: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
});
