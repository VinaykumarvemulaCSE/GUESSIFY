import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export const GameBottomNav: React.FC = () => {
  const { currentScreen, navigateTo, settings } = useApp();

  const handleTabPress = (screen: any) => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigateTo(screen);
  };

  const tabs = [
    {
      id: 'DASHBOARD',
      label: 'Play',
      iconActive: 'game-controller' as const,
      iconInactive: 'game-controller-outline' as const,
      color: COLORS.primaryContainer,
    },
    {
      id: 'LEADERBOARD',
      label: 'Ranks',
      iconActive: 'trophy' as const,
      iconInactive: 'trophy-outline' as const,
      color: COLORS.secondary,
    },
    {
      id: 'HISTORY',
      label: 'History',
      iconActive: 'time' as const,
      iconInactive: 'time-outline' as const,
      color: COLORS.tertiary,
    },
    {
      id: 'PROFILE',
      label: 'Profile',
      iconActive: 'person' as const,
      iconInactive: 'person-outline' as const,
      color: COLORS.primaryFixed,
    },
    {
      id: 'SETTINGS',
      label: 'Settings',
      iconActive: 'settings' as const,
      iconInactive: 'settings-outline' as const,
      color: COLORS.onSurface,
    },
  ];

  return (
    <View style={styles.navContainer}>
      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => handleTabPress(tab.id)}
              style={styles.navItem}
            >
              <View
                style={[
                  styles.iconWrap,
                  isActive && {
                    backgroundColor: `${tab.color}1F`,
                    borderColor: `${tab.color}60`,
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconInactive}
                  size={22}
                  color={isActive ? tab.color : COLORS.onSurfaceVariant}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  isActive && { color: tab.color, fontWeight: '700' },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: tab.color },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(205, 186, 162, 0.45)',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    shadowColor: '#5C3A21',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  activeIndicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginTop: 3,
  },
});
