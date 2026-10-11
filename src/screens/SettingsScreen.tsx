import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { GlowCard } from '../components/common/GlowCard';

export const SettingsScreen: React.FC = () => {
  const {
    profile,
    settings,
    updateSettings,
    clearMatchHistory,
    logout,
    navigateTo,
  } = useApp();

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
          onPress={() => navigateTo('DASHBOARD')}
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
              onPress={() => navigateTo('PROFILE')}
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
            onPress={() => navigateTo('RULES')}
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
            style={[styles.navRow, { borderBottomWidth: 0 }]}
            onPress={() => navigateTo('ABOUT')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.12)' }]}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.primaryContainer} />
              </View>
              <View style={styles.settingMeta}>
                <Text style={styles.settingTitle}>About Guessify</Text>
                <Text style={styles.settingSub}>Version 1.1 • Nostalgic Guessing Game</Text>
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
      </ScrollView>
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
});
