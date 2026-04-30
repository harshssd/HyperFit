import React from 'react';
import LoginView from '../components/LoginView';
import { useAuthContext } from '../contexts/AuthContext';

export const LoginScreen = () => {
  const auth = useAuthContext();
  return (
    <LoginView
      onEmailLogin={auth.signInWithEmail}
      onGoogleLogin={auth.signInWithGoogle}
      onSignUp={auth.signUpWithEmail}
    />
  );
};
