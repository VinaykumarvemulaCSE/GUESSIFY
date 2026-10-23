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
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { NeonButton } from '../components/common/NeonButton';
import { NeuralBulbLogo } from '../components/common/NeuralBulbLogo';

export const SignUpScreen: React.FC = () => {
  const { signUpUser } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await signUpUser(name.trim(), email.trim(), password.trim());
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to create account.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <NeuralBulbLogo size={70} />
          <Text style={styles.title}>
            Join <Text style={styles.highlight}>Guessify</Text>
          </Text>
          <Text style={styles.subtitle}>Unlock ranked battles and compete on the global leaderboard</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Inputs */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PLAYER NAME</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.charcoalMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your gamer tag (e.g. ApexGuesser)"
                placeholderTextColor={COLORS.charcoalLight}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

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
                placeholder="Create password (min 6 characters)"
                placeholderTextColor={COLORS.charcoalLight}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.charcoalMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={COLORS.charcoalLight}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          <NeonButton
            title={loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            variant="primary"
            size="lg"
            disabled={loading}
            onPress={handleSignUp}
            style={{ width: '100%', marginTop: SPACING.md }}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Sign In</Text>
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
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  highlight: {
    color: COLORS.primaryContainer,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
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
    marginBottom: SPACING.sm + 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.charcoalMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: SPACING.md,
    height: 50,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primaryContainer,
    fontSize: 14,
    fontWeight: '700',
  },
});
