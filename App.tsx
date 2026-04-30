import React, { useState } from 'react';
import { View, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';

import { layoutStyles } from './src/styles';
import HomeViewComponent from './src/components/HomeView';
import HistoryAnalyticsView from './src/features/history/HistoryAnalyticsView';
import ChallengesViewComponent from './src/components/ChallengesView';
import Header from './src/components/Header';
import NavBar from './src/components/NavBar';
import LoadingScreen from './src/components/LoadingScreen';
import LoginView from './src/components/LoginView';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { GymView } from './src/features/workout';
import { NAV_ITEMS } from './src/constants/nav';
import { ASSETS } from './src/constants/appConstants';
import { calculateXP } from './src/features/workout/helpers';
import { UserProvider } from './src/contexts/UserContext';
import { useAuth } from './src/hooks/useAuth';
import { useUserData } from './src/hooks/useUserData';

WebBrowser.maybeCompleteAuthSession();

type Tab = 'home' | 'gym' | 'challenges' | 'history';

export default function App() {
  const auth = useAuth();
  const { data, setData, loading: dataLoading } = useUserData(auth.user);
  const [activeTab, setActiveTab] = useState<Tab>('home');

  if (auth.status === 'loading' || (auth.status === 'authenticated' && dataLoading)) {
    return <LoadingScreen message="INITIALIZING SYSTEM..." />;
  }

  if (auth.status === 'unauthenticated' || !auth.user) {
    return (
      <LoginView
        onEmailLogin={auth.signInWithEmail}
        onGoogleLogin={auth.signInWithGoogle}
        onSignUp={auth.signUpWithEmail}
      />
    );
  }

  const user = auth.user;
  const username = user.email?.split('@')[0] || user.user_metadata?.full_name || 'User';

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeViewComponent
            data={data}
            onChangeView={setActiveTab as (tab: string) => void}
            streak={data.gymLogs.length}
            xp={calculateXP(data)}
          />
        );
      case 'gym':
        return <GymView data={data} updateData={setData} user={user} />;
      case 'challenges':
        return <ChallengesViewComponent />;
      case 'history':
        return <HistoryAnalyticsView />;
    }
  };

  return (
    <UserProvider user={user}>
      <ImageBackground
        source={{ uri: ASSETS.background }}
        style={layoutStyles.appContainer}
        resizeMode="cover"
      >
        <View style={layoutStyles.appOverlay} />
        <SafeAreaView style={layoutStyles.appContent} edges={['top']}>
          <Header
            streak={data.gymLogs.length}
            xp={calculateXP(data)}
            onLogout={auth.signOut}
            username={username}
          />
          <ScrollView
            style={layoutStyles.mainContent}
            contentContainerStyle={layoutStyles.mainContentContainer}
          >
            <ErrorBoundary fallbackLabel={`Error in ${activeTab}`}>
              {renderContent()}
            </ErrorBoundary>
          </ScrollView>
          <NavBar
            activeTab={activeTab}
            onChange={(t: string) => setActiveTab(t as Tab)}
            items={NAV_ITEMS}
          />
        </SafeAreaView>
        <StatusBar style="light" />
      </ImageBackground>
    </UserProvider>
  );
}
