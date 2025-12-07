import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, TextInput } from 'react-native';
import { Zap, AlertTriangle, Loader } from 'lucide-react-native';
import NeonButton from './NeonButton';
import styles from '../styles/appStyles';
import { ASSETS } from '../constants/appConstants';

type LoginViewProps = {
  onEmailLogin: (email: string, password: string) => Promise<any>;
  onGoogleLogin: () => Promise<any>;
  onSignUp: (email: string, password: string) => Promise<any>;
};

const LoginView = ({ onEmailLogin, onGoogleLogin, onSignUp }: LoginViewProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await onSignUp(email, password);
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
    try {
      await onGoogleLogin();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: ASSETS.background }}
      style={styles.loginContainer}
      resizeMode="cover"
    >
      <ScrollView 
        contentContainerStyle={styles.loginScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginCard}>
          <View style={styles.loginHeader}>
            <View style={styles.loginLogo}>
              <Zap size={32} color="#0f172a" />
            </View>
            <Text style={styles.loginTitle}>
              HYPER<Text style={styles.loginTitleAccent}>FIT</Text>
            </Text>
            <Text style={styles.loginSubtitle}>Next Gen Training OS</Text>
          </View>

          <View style={styles.loginForm}>
            {error ? (
              <View style={styles.loginError}>
                <AlertTriangle size={16} color="#f87171" />
                <Text style={styles.loginErrorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.loginLabel}>EMAIL</Text>
            <TextInput
              style={styles.loginInput}
              placeholder="your.email@example.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />

            <Text style={[styles.loginLabel, { marginTop: 16 }]}>PASSWORD</Text>
            <TextInput
              style={styles.loginInput}
              placeholder="Enter password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={isSignUp ? "newPassword" : "password"}
              onSubmitEditing={handleEmailAuth}
            />

            <NeonButton 
              onPress={handleEmailAuth} 
              disabled={isLoading} 
              style={styles.loginButton}
            >
              {isLoading ? (
                <Loader size={20} color="#0f172a" />
              ) : (
                <Text>{isSignUp ? 'SIGN UP' : 'SIGN IN'}</Text>
              )}
            </NeonButton>

            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              style={styles.loginToggle}
            >
              <Text style={styles.loginToggleText}>
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginDivider}>
              <View style={styles.loginDividerLine} />
              <Text style={styles.loginDividerText}>OR</Text>
              <View style={styles.loginDividerLine} />
            </View>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
            >
              <View style={styles.googleButtonContent}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.loginFooter}>V 2.1.0 // SECURE CONNECTION</Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default LoginView;

