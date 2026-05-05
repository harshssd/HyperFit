import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, MailCheck } from 'lucide-react-native';
import { HeroGradient } from './HeroGradient';
import { palette, accent, text, spacing, radii, fonts } from '../styles/theme';

type LoginViewProps = {
  onEmailLogin: (email: string, password: string) => Promise<any>;
  onGoogleLogin: () => Promise<any>;
  onSignUp: (
    email: string,
    password: string,
  ) => Promise<{ needsConfirmation: boolean; alreadyExists: boolean } | void>;
  onResetPassword: (email: string) => Promise<void>;
};

const LoginView = ({ onEmailLogin, onGoogleLogin, onSignUp, onResetPassword }: LoginViewProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    setIsLoading(true);
    setError('');
    setInfo('');
    try {
      if (isSignUp) {
        const result = await onSignUp(email, password);
        if (result?.alreadyExists) {
          setError('An account with this email already exists. Try signing in.');
          setIsSignUp(false);
        } else if (result?.needsConfirmation) {
          setInfo(`Check ${email.trim()} to confirm your account, then sign in.`);
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        await onEmailLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setInfo('');
    try {
      await onGoogleLogin();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email above, then tap Forgot password again.');
      return;
    }
    setIsLoading(true);
    setError('');
    setInfo('');
    try {
      await onResetPassword(trimmed);
      setInfo(`Reset link sent to ${trimmed}. Check your inbox.`);
    } catch (err: any) {
      setError(err.message || 'Could not send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      testID="login-screen"
      style={{ flex: 1, backgroundColor: palette.bg, overflow: 'hidden' }}
    >
      <HeroGradient tint="orange" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.xxl,
            paddingBottom: spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand poster — wordmark dominates the top third */}
          <View style={{ alignItems: 'flex-start', marginBottom: spacing.xxl + spacing.lg }}>
            <Text
              style={{
                color: text.primary,
                fontSize: 56,
                fontFamily: fonts.family.black,
                letterSpacing: -2,
                lineHeight: 60,
              }}
            >
              HYPER<Text style={{ color: accent.lift }}>FIT</Text>
            </Text>
            <Text
              style={{
                color: text.tertiary,
                fontSize: 11,
                fontFamily: fonts.family.mono,
                fontWeight: fonts.weight.bold as '700',
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginTop: spacing.sm,
              }}
            >
              Next Gen Training OS
            </Text>
          </View>

          {/* Banners */}
          {error ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: 'rgba(239, 68, 68, 0.10)',
                borderColor: accent.regression,
                borderWidth: 1,
                borderRadius: radii.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
              }}
            >
              <AlertTriangle size={16} color={accent.regression} />
              <Text style={{ color: text.primary, fontSize: 13, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          {info ? (
            <View
              testID="login-info"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: 'rgba(0, 214, 143, 0.10)',
                borderColor: accent.sessionUp,
                borderWidth: 1,
                borderRadius: radii.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
              }}
            >
              <MailCheck size={16} color={accent.sessionUp} />
              <Text style={{ color: text.primary, fontSize: 13, flex: 1 }}>{info}</Text>
            </View>
          ) : null}

          {/* Email */}
          <Label>Email</Label>
          <TextInput
            testID="login-email-input"
            style={inputStyle(email.length > 0)}
            placeholder="your.email@example.com"
            placeholderTextColor={text.disabled}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
          />

          {/* Password */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>Password</Label>
            {!isSignUp ? (
              <TouchableOpacity
                testID="login-forgot-password"
                onPress={handleResetPassword}
                disabled={isLoading}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Send password reset email"
              >
                <Text
                  style={{
                    color: text.tertiary,
                    fontSize: 11,
                    fontFamily: fonts.family.mono,
                    fontWeight: fonts.weight.bold as '700',
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                    marginBottom: spacing.sm,
                  }}
                >
                  Forgot?
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TextInput
            testID="login-password-input"
            style={inputStyle(password.length > 0)}
            placeholder="Enter password"
            placeholderTextColor={text.disabled}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            onSubmitEditing={handleEmailAuth}
          />

          {/* Primary CTA */}
          <TouchableOpacity
            testID="login-submit-button"
            onPress={handleEmailAuth}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Sign up' : 'Sign in'}
            accessibilityState={{ disabled: isLoading, busy: isLoading }}
            style={{
              backgroundColor: accent.lift,
              paddingVertical: spacing.lg,
              borderRadius: radii.md,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading ? 0.4 : 1,
              marginTop: spacing.lg,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={text.primary} />
            ) : (
              <Text
                style={{
                  color: text.primary,
                  fontSize: 13,
                  fontFamily: fonts.family.mono,
                  fontWeight: fonts.weight.black as '900',
                  letterSpacing: 1.6,
                }}
              >
                {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
              </Text>
            )}
          </TouchableOpacity>

          {/* OR divider */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              marginVertical: spacing.xl,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: palette.borderStrong }} />
            <Text
              style={{
                color: text.quaternary,
                fontSize: 11,
                fontFamily: fonts.family.mono,
                fontWeight: fonts.weight.bold as '700',
                letterSpacing: 2,
              }}
            >
              OR
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: palette.borderStrong }} />
          </View>

          {/* Google secondary */}
          <TouchableOpacity
            testID="login-google-button"
            onPress={handleGoogleLogin}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityState={{ disabled: isLoading, busy: isLoading }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.borderStrong,
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              opacity: isLoading ? 0.4 : 1,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#4285F4', fontSize: 13, fontWeight: '900' }}>G</Text>
            </View>
            <Text
              style={{
                color: text.primary,
                fontSize: 14,
                fontWeight: fonts.weight.semibold as '600',
              }}
            >
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Sign-in / Sign-up toggle */}
          <TouchableOpacity
            testID="login-mode-toggle"
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setInfo('');
            }}
            style={{ alignItems: 'center', marginTop: spacing.xl, paddingVertical: spacing.sm }}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Switch to sign in' : 'Switch to sign up'}
          >
            <Text style={{ color: text.tertiary, fontSize: 13 }}>
              {isSignUp ? 'Already have an account? ' : "New here? "}
              <Text style={{ color: accent.lift, fontWeight: fonts.weight.bold as '700' }}>
                {isSignUp ? 'Sign in' : 'Create account'}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <Text
    style={{
      color: text.quaternary,
      fontSize: 11,
      fontFamily: fonts.family.mono,
      fontWeight: fonts.weight.bold as '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    }}
  >
    {children}
  </Text>
);

const inputStyle = (filled: boolean) => ({
  backgroundColor: palette.surface,
  borderColor: filled ? accent.lift : palette.borderStrong,
  borderWidth: 1,
  borderRadius: radii.md,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  color: text.primary,
  fontSize: 16,
  fontWeight: fonts.weight.semibold as '600',
});

export default LoginView;
