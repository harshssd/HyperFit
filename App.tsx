import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { layoutStyles } from './src/styles';

// Complete auth session for OAuth
WebBrowser.maybeCompleteAuthSession();
import {
  Home,
  Footprints,
  Dumbbell,
  Trophy,
  CheckCircle,
  Circle,
  Plus,
  Minus,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Trash2,
  Search,
  Medal,
  RotateCcw,
  Users,
  User,
  Swords,
  ArrowRight,
  Play,
  Crown,
  Watch,
  RefreshCw,
  Zap,
  Save,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Layout,
  PlusCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart2,
  TrendingUp,
  Activity,
  Smartphone,
  Settings,
  Target,
  AlertTriangle,
  Weight,
  Share2,
  Star,
  Octagon,
  Shield,
  List,
  Maximize2,
  Edit3,
  History,
  Loader,
  Folder,
  FolderPlus,
  Tag,
  Filter,
  Copy,
  Heart,
  MoreVertical,
  Grid,
  Bookmark,
} from 'lucide-react-native';
import GlassCard from './src/components/GlassCard';
import NeonButton from './src/components/NeonButton';
import NumberControl from './src/components/NumberControl';
import TemplatePickerModal from './src/components/TemplatePickerModal';
import SaveTemplateModal from './src/components/SaveTemplateModal';
import AddExerciseOverlay from './src/components/AddExerciseOverlay';
import ChallengesViewComponent from './src/components/ChallengesView';
import WorkoutHeader from './src/features/workout/components/WorkoutHeader';
import WorkoutFocusHeader from './src/features/workout/components/WorkoutFocusHeader';
import CreateFolderModal from './src/components/CreateFolderModal';
import WorkoutOverview from './src/features/workout/components/WorkoutOverview';
import WorkoutListView from './src/features/workout/components/WorkoutListView';
import WorkoutFocusSets from './src/features/workout/components/WorkoutFocusSets';
import WorkoutFocusActions from './src/features/workout/components/WorkoutFocusActions';
import EmptyWorkoutCard from './src/features/workout/components/EmptyWorkoutCard';
import HomeViewComponent from './src/components/HomeView';
import HistoryView from './src/features/history/HistoryView';
import AnalyticsView from './src/features/analytics/AnalyticsView';
import Header from './src/components/Header';
import FinishedSessionView from './src/features/workout/components/FinishedSessionView';
import ProgressRing from './src/components/ProgressRing';
import NavBar from './src/components/NavBar';
import { GymView } from './src/features/workout';
import { NAV_ITEMS } from './src/constants/nav';
import LoadingScreen from './src/components/LoadingScreen';
import { WorkoutExercise, Template, UserData } from './src/types/workout';
import {
  isExerciseEmpty,
  renameExercise,
  updateSetValue,
  addSetToExercise,
  deleteExerciseFromWorkout,
  moveExerciseInWorkout,
  calculateTotalVolume,
  calculateXP,
  getRank,
  getExerciseConfig,
  finishWorkoutState,
  undoFinishState,
  startNewSessionState,
  abortSessionState,
} from './src/features/workout/helpers';

// --- Supabase Imports ---
import {
  getInitialSession,
  onAuthStateChange,
  loadUserData,
  subscribeToUserData,
  upsertUserData,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  setSessionFromTokens,
} from './src/services/supabaseClient';

import {
  ASSETS,
  CHALLENGE_LIBRARY,
  WORKOUT_TEMPLATES,
  DEFAULT_EXERCISES,
  DEFAULT_DATA,
} from './src/constants/appConstants';
import {
  ABORT_SESSION_TITLE,
  ABORT_SESSION_MESSAGE,
} from './src/constants/text';
import SimpleBarChart from './src/components/SimpleBarChart';
import LoginView from './src/components/LoginView';
import { UserProvider } from './src/contexts/UserContext';

// --- Application Views ---
// LoginView moved to src/components/LoginView.tsx

// --- App Shell ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserData>(DEFAULT_DATA);

  // Auth State Listener
  useEffect(() => {
    // Check initial session
    getInitialSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Data Sync Listener
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const fetchUserData = async () => {
      try {
        const loaded = await loadUserData(user.id, DEFAULT_DATA);
        setData({ ...DEFAULT_DATA, ...loaded });
      } catch (e) {
        console.error("Data sync error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Set up real-time subscription
    const unsubscribe = subscribeToUserData(user.id, (newData) => {
      setData({ ...DEFAULT_DATA, ...newData });
    });

    return () => unsubscribe();
  }, [user]);

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await signInWithEmail(email, password);
      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const { data, error } = await signUpWithEmail(email, password);
      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // For Expo, we need to use a custom redirect URL
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'hyperfit',
        path: 'auth/callback',
      });

      const { data, error } = await signInWithGoogle(redirectUrl);

      if (error) throw error;

      // Handle the OAuth response
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const url = new URL(result.url);
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await setSessionFromTokens(
              accessToken,
              refreshToken
            );

            if (sessionError) throw sessionError;
            return sessionData;
          }
        }
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Google sign in failed');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setData(DEFAULT_DATA);
  };

  const saveData = async (newData: any) => {
    if (!user) return;
    try {
      setData(newData);
      // Deprecated: Monolithic save is being replaced by granular service calls.
      // We will remove this call once all features are migrated to use specific service functions.
      // await upsertUserData(user.id, newData);
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeViewComponent data={data} onChangeView={setActiveTab} streak={data.gymLogs.length} xp={calculateXP(data)} />;
      case 'gym':
        return <GymView data={data} updateData={saveData} />;
      case 'challenges':
        return <ChallengesViewComponent />;
      case 'history':
        return <HistoryView data={data} updateData={saveData} />;
      case 'stats':
        return <AnalyticsView data={data} />;
      default:
        return <HomeViewComponent data={data} onChangeView={setActiveTab} streak={data.gymLogs.length} xp={calculateXP(data)} />;
    }
  };

  if (loading) {
    return (
      <LoadingScreen message="INITIALIZING SYSTEM..." />
    );
  }

  if (!user) {
    return (
      <LoginView
        onEmailLogin={handleEmailLogin}
        onGoogleLogin={handleGoogleLogin}
        onSignUp={handleSignUp}
      />
    );
  }

  return (
    <UserProvider user={user} setUser={setUser}>
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
            onLogout={handleLogout}
            username={user.email?.split('@')[0] || user.user_metadata?.full_name || 'User'}
          />
          <ScrollView style={layoutStyles.mainContent} contentContainerStyle={layoutStyles.mainContentContainer}>
            {renderContent()}
          </ScrollView>
          <NavBar
            activeTab={activeTab}
            onChange={setActiveTab}
            items={NAV_ITEMS}
          />
        </SafeAreaView>
        <StatusBar style="light" />
      </ImageBackground>
    </UserProvider>
  );
}
