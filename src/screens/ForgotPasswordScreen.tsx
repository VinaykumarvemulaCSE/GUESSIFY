import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { NeonButton } from '../components/common/NeonButton';

export const ForgotPasswordScreen: React.FC = () => {
  const { resetPasswordEmail } = useApp();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await resetPasswordEmail(email.trim());
    setLoading(false);
    if (res.success) {
      setSent(true);
    } else {
      setError(res.error || 'Failed to send password reset email.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RESET PASSWORD</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={48} color={COLORS.secondary} />
        </View>

        <Text style={styles.title}>Forgot Your Password?</Text>
        <Text style={styles.description}>
          Enter your registered email address below and we&apos;ll send a recovery link to reset your account credentials.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {sent ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.successText}>
              Password reset link has been dispatched to your email!
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.charcoalMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Enter your registered email address"
                placeholderTextColor={COLORS.charcoalLight}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <NeonButton
              title={loading ? 'SENDING...' : 'SEND RESET LINK'}
              variant="primary"
              size="lg"
              disabled={loading}
              onPress={handleReset}
              style={{ width: '100%', marginTop: SPACING.lg }}
            />
          </View>
        )}

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: SPACING.xl }}>
          <Text style={styles.backToLogin}>Return to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.margin,
    paddingTop: 50,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },
  content: {
    alignItems: 'center',
    marginTop: 60,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.charcoalLight,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  input: {
    flex: 1,
    color: COLORS.charcoal,
    fontSize: 15,
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 180, 171, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    width: '100%',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
  },
  successBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  backToLogin: {
    color: COLORS.primaryContainer,
    fontWeight: '700',
    fontSize: 14,
  },
});
