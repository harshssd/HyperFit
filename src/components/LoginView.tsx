import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Zap, AlertTriangle, MailCheck } from 'lucide-react-native';
import NeonButton from './NeonButton';
import { loginStyles } from '../styles';
import { palette, text, accent } from '../styles/theme';
import { ASSETS } from '../constants/appConstants';

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

  // Send a reset link to whatever's in the email field. Trim/validate locally
  // so we surface "enter your email" before hitting the network rather than
  // returning a generic Supabase error after a round-trip.
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
    <ImageBackground
      testID="login-screen"
      source={{ uri: ASSETS.background }}
      style={loginStyles.loginContainer}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={loginStyles.loginScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={loginStyles.loginCard}>
          <View style={loginStyles.loginHeader}>
            <View style={loginStyles.loginLogo}>
              <Zap size={28} color={palette.bg} strokeWidth={3} />
            </View>
            <Text style={loginStyles.loginTitle}>
              HYPER<Text style={loginStyles.loginTitleAccent}>FIT</Text>
            </Text>
            <Text style={loginStyles.loginSubtitle}>Next Gen Training OS</Text>
          </View>

          <View style={loginStyles.loginForm}>
            {error ? (
              <View style={loginStyles.loginError}>
                <AlertTriangle size={16} color={accent.regression} />
                <Text style={loginStyles.loginErrorText}>{error}</Text>
              </View>
            ) : null}

            {info ? (
              <View testID="login-info" style={loginStyles.loginInfo}>
                <MailCheck size={16} color={accent.sessionUp} />
                <Text style={loginStyles.loginInfoText}>{info}</Text>
              </View>
            ) : null}

            <Text style={loginStyles.loginLabel}>EMAIL</Text>
            <TextInput
              testID="login-email-input"
              style={loginStyles.loginInput}
              placeholder="your.email@example.com"
              placeholderTextColor={text.disabled}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />

            <Text style={loginStyles.loginLabel}>PASSWORD</Text>
            <TextInput
              testID="login-password-input"
              style={loginStyles.loginInput}
              placeholder="Enter password"
              placeholderTextColor={text.disabled}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={isSignUp ? "newPassword" : "password"}
              onSubmitEditing={handleEmailAuth}
            />

            {!isSignUp ? (
              <TouchableOpacity
                testID="login-forgot-password"
                onPress={handleResetPassword}
                disabled={isLoading}
                style={loginStyles.loginForgot}
                accessibilityRole="button"
                accessibilityLabel="Send password reset email"
              >
                <Text style={loginStyles.loginForgotText}>Forgot password?</Text>
              </TouchableOpacity>
            ) : null}

            <NeonButton
              testID="login-submit-button"
              onPress={handleEmailAuth}
              disabled={isLoading}
              style={loginStyles.loginButton}
              accessibilityLabel={isSignUp ? 'Sign up' : 'Sign in'}
              accessibilityState={{ disabled: isLoading, busy: isLoading }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={palette.bg} />
              ) : (
                isSignUp ? 'SIGN UP' : 'SIGN IN'
              )}
            </NeonButton>

            <TouchableOpacity
              testID="login-mode-toggle"
              onPress={() => setIsSignUp(!isSignUp)}
              style={loginStyles.loginToggle}
              accessibilityRole="button"
              accessibilityLabel={isSignUp ? 'Switch to sign in' : 'Switch to sign up'}
            >
              <Text style={loginStyles.loginToggleText}>
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Text>
            </TouchableOpacity>

            <View style={loginStyles.loginDivider}>
              <View style={loginStyles.loginDividerLine} />
              <Text style={loginStyles.loginDividerText}>OR</Text>
              <View style={loginStyles.loginDividerLine} />
            </View>

            <TouchableOpacity
              testID="login-google-button"
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={[loginStyles.googleButton, isLoading && loginStyles.googleButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              accessibilityState={{ disabled: isLoading, busy: isLoading }}
            >
              <View style={loginStyles.googleButtonContent}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={text.primary} />
                ) : (
                  <>
                    <View style={loginStyles.googleIconChip}>
                      <Text style={loginStyles.googleIconLetter}>G</Text>
                    </View>
                    <Text style={loginStyles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <Text style={loginStyles.loginFooter}>V 2.1.0 // SECURE CONNECTION</Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default LoginView;

