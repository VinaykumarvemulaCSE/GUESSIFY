import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { NeonButton } from '../components/common/NeonButton';
import { NeuralBulbLogo } from '../components/common/NeuralBulbLogo';

export const LoginScreen: React.FC = () => {
  const { navigateTo, loginWithEmail, loginAsGuest } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await loginWithEmail(email.trim(), password.trim());
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleGuest = async () => {
    await loginAsGuest();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.header}>
          <NeuralBulbLogo size={80} />
          <Text style={styles.title}>
            Welcome Back to <Text style={styles.highlight}>Guessify</Text>
          </Text>
          <Text style={styles.subtitle}>Enter the arena to track ranks and duel friends</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Input Fields */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.charcoalMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor={COLORS.charcoalLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.charcoalMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.charcoalLight}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.charcoalMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigateTo('FORGOT_PASSWORD')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <NeonButton
            title={loading ? 'SIGNING IN...' : 'SIGN IN'}
            variant="primary"
            size="lg"
            disabled={loading}
            onPress={handleLogin}
            style={{ width: '100%', marginTop: SPACING.sm }}
          />

          {/* Instant Guest Play */}
          <NeonButton
            title="PLAY AS GUEST"
            variant="outline"
            size="md"
            onPress={handleGuest}
            style={{ width: '100%', marginTop: SPACING.md }}
          />
        </View>

        {/* Footer Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => navigateTo('SIGNUP')}>
            <Text style={styles.signUpLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scroll: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  highlight: {
    color: COLORS.primaryContainer,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 6,
    textAlign: 'center',
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
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.charcoalMuted,
    letterSpacing: 1,
    marginBottom: 6,
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.charcoal,
    fontSize: 15,
    fontWeight: '500',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.md,
  },
  forgotText: {
    color: COLORS.charcoalMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
  },
  dividerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    marginHorizontal: SPACING.md,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
  },
  signUpLink: {
    color: COLORS.primaryContainer,
    fontSize: 14,
    fontWeight: '700',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.outline,
    width: '100%',
    shadowColor: '#5C3A21',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  googleBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
});
