import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, TextInput } from 'react-native';
import { Zap, AlertTriangle, Loader } from 'lucide-react-native';
import NeonButton from './NeonButton';
import { loginStyles } from '../styles';
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
      style={loginStyles.loginContainer}
      resizeMode="cover"
    >
      <ScrollView 
        contentContainerStyle={loginStyles.loginScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={loginStyles.loginCard}>
          <View style={loginStyles.loginHeader}>
            <View style={loginStyles.loginLogo}>
              <Zap size={32} color="#0f172a" />
            </View>
            <Text style={loginStyles.loginTitle}>
              HYPER<Text style={loginStyles.loginTitleAccent}>FIT</Text>
            </Text>
            <Text style={loginStyles.loginSubtitle}>Next Gen Training OS</Text>
          </View>

          <View style={loginStyles.loginForm}>
            {error ? (
              <View style={loginStyles.loginError}>
                <AlertTriangle size={16} color="#f87171" />
                <Text style={loginStyles.loginErrorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={loginStyles.loginLabel}>EMAIL</Text>
            <TextInput
              style={loginStyles.loginInput}
              placeholder="your.email@example.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />

            <Text style={[loginStyles.loginLabel, { marginTop: 16 }]}>PASSWORD</Text>
            <TextInput
              style={loginStyles.loginInput}
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
              style={loginStyles.loginButton}
            >
              {isLoading ? (
                <Loader size={20} color="#0f172a" />
              ) : (
                <Text>{isSignUp ? 'SIGN UP' : 'SIGN IN'}</Text>
              )}
            </NeonButton>

            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              style={loginStyles.loginToggle}
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
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={[loginStyles.googleButton, isLoading && loginStyles.googleButtonDisabled]}
            >
              <View style={loginStyles.googleButtonContent}>
                <Text style={loginStyles.googleIcon}>G</Text>
                <Text style={loginStyles.googleButtonText}>Continue with Google</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={loginStyles.loginFooter}>V 2.1.0 // SECURE CONNECTION</Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default LoginView;

