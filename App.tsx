import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

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
import StepsViewComponent from './src/components/StepsView';
import WorkoutHeader from './src/components/WorkoutHeader';
import WorkoutFocusHeader from './src/components/WorkoutFocusHeader';
import CreateFolderModal from './src/components/CreateFolderModal';
import WorkoutOverview from './src/components/WorkoutOverview';
import WorkoutListView from './src/components/WorkoutListView';
import WorkoutFocusSets from './src/components/WorkoutFocusSets';
import WorkoutFocusActions from './src/components/WorkoutFocusActions';
import EmptyWorkoutCard from './src/components/EmptyWorkoutCard';
import HomeViewComponent from './src/components/HomeView';
import StatsViewComponent from './src/components/StatsView';
import Header from './src/components/Header';
import FinishedSessionView from './src/components/FinishedSessionView';
import ProgressRing from './src/components/ProgressRing';
import NavBar from './src/components/NavBar';
import { GymView } from './src/features/workout';
import { NAV_ITEMS } from './src/constants/nav';
import LoadingScreen from './src/components/LoadingScreen';
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

// --- Application Views ---
// LoginView moved to src/components/LoginView.tsx

// --- App Shell ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(DEFAULT_DATA);

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
      await upsertUserData(user.id, newData);
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeViewComponent data={data} onChangeView={setActiveTab} streak={data.gymLogs.length} xp={calculateXP(data)} />;
      case 'steps':
        return <StepsViewComponent />;
      case 'gym':
        return <GymView data={data} updateData={saveData} user={user} />;
      case 'challenges':
        return <ChallengesViewComponent />;
      case 'stats':
        return <StatsViewComponent data={data} />;
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
    <ImageBackground
      source={{ uri: ASSETS.background }}
      style={styles.appContainer}
      resizeMode="cover"
    >
      <View style={styles.appOverlay} />
      <SafeAreaView style={styles.appContent} edges={['top']}>
        <Header
          streak={data.gymLogs.length}
          xp={calculateXP(data)}
          onLogout={handleLogout}
          username={user.email?.split('@')[0] || user.user_metadata?.full_name || 'User'}
        />
        <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainContentContainer}>
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
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // App Container
  appContainer: {
    flex: 1,
  },
  appOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  appContent: {
    flex: 1,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  mainContent: {
    flex: 1,
  },
  mainContentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#22d3ee',
    fontFamily: 'monospace',
    marginTop: 16,
  },

  // Header
  header: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
  },
  headerTitleAccent: {
    color: '#f97316',
  },
  headerRank: {
    marginTop: 4,
  },
  headerRankText: {
    fontSize: 9,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: 'currentColor',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakContainer: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 2,
  },

  // Login
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
  },
  loginTitleAccent: {
    color: '#f97316',
  },
  loginSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  loginForm: {
    width: '100%',
    gap: 16,
  },
  loginLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  loginInput: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    color: '#fff',
    fontFamily: 'monospace',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  loginButton: {
    width: '100%',
  },
  loginFooter: {
    fontSize: 10,
    color: '#475569',
    fontFamily: 'monospace',
    marginTop: 24,
  },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loginError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: 8,
    marginBottom: 16,
  },
  loginErrorText: {
    color: '#f87171',
    fontSize: 12,
    flex: 1,
  },
  loginToggle: {
    marginTop: 12,
    paddingVertical: 8,
  },
  loginToggleText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  loginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  loginDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  loginDividerText: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Glass Card
  glassCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  glassCardNoPadding: {
    padding: 0,
  },
  glassCardPressable: {
    borderColor: '#f97316',
  },

  // Neon Button
  neonButton: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  neonButtonBase: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 14,
  },
  neonButtonPrimary: {
    backgroundColor: '#f97316',
    borderWidth: 1,
    borderColor: '#fb923c',
  },
  neonButtonSecondary: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  neonButtonDanger: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  neonButtonGhost: {
    backgroundColor: 'transparent',
  },
  neonButtonDisabled: {
    opacity: 0.5,
  },
  neonButtonText: {
    color: '#f97316',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  neonButtonTextPrimary: {
    color: '#0f172a',
  },
  neonButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  // Number Control
  numberControl: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  numberControlLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  numberControlContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    padding: 4,
  },
  numberControlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  numberControlInput: {
    flex: 1,
    backgroundColor: 'transparent',
    textAlign: 'center',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Chart
  chartContainer: {
    height: 160,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    paddingTop: 16,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  chartBarContainer: {
    width: '100%',
    height: 128,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    opacity: 0.8,
  },
  chartLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#64748b',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartEmpty: {
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartEmptyText: {
    color: '#475569',
    fontSize: 12,
    fontFamily: 'monospace',
  },

  // Gym View
  gymView: {
    flex: 1,
    position: 'relative',
  },
  gymViewContent: {
    paddingBottom: 24,
  },
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 400,
  },
  finishedIcon: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  finishedText: {
    alignItems: 'center',
    marginBottom: 24,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  finishedSubtitle: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 8,
  },
  finishedStats: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 32,
  },
  finishedStatCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  finishedStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  finishedStatLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  finishedActions: {
    width: '100%',
    gap: 12,
  },
  finishedButton: {
    width: '100%',
  },
  finishedUndo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  finishedUndoText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Template Picker
  templateModalSafeArea: {
    flex: 1,
  },
  templatePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    zIndex: 50,
    padding: 0,
  },
  templatePicker: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  templatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  templatePickerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  templatePickerSubtitle: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  templatePickerClose: {
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 999,
  },
  templatePickerList: {
    flex: 1,
    marginTop: 8,
  },
  templatePickerListContent: {
    paddingBottom: 24,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateActionButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  templateIcon: {
    fontSize: 24,
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 8,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f97316',
  },
  templateDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  templateSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  templateSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  templateFilterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  templateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
  },
  templateFilterButtonActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: '#f97316',
  },
  templateFilterText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  templateFilterTextActive: {
    color: '#f97316',
  },
  templateFolderSelector: {
    marginBottom: 16,
    maxHeight: 50,
  },
  templateFolderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    marginRight: 8,
  },
  templateFolderChipActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: '#f97316',
  },
  templateFolderChipNew: {
    borderStyle: 'dashed',
    borderColor: '#f97316',
  },
  templateFolderChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  templateFolderChipTextActive: {
    color: '#f97316',
  },
  templateFolderIcon: {
    fontSize: 14,
  },
  templateTagsSelector: {
    marginBottom: 16,
    maxHeight: 50,
  },
  templateTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    marginRight: 8,
  },
  templateTagChipActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  templateTagChipText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  templateTagChipTextActive: {
    color: '#0f172a',
  },
  templateLoadingContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 16,
  },
  templateLoadingText: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  templateEmptyContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 8,
  },
  templateEmptyText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  templateEmptySubtext: {
    color: '#475569',
    fontSize: 12,
  },
  templateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  templateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateFavoriteButton: {
    padding: 4,
  },
  templateMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  templateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#1e293b',
    borderRadius: 6,
  },
  templateBadgeText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  templateTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  templateTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#1e293b',
    borderRadius: 4,
  },
  templateTagBadgeText: {
    fontSize: 8,
    color: '#64748b',
  },
  templateTagMore: {
    fontSize: 8,
    color: '#64748b',
    marginLeft: 4,
  },
  saveTemplateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saveTemplateSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  saveTemplateLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  saveTemplateFolderSelector: {
    marginBottom: 16,
    maxHeight: 50,
  },
  saveTemplateTagsContainer: {
    marginBottom: 16,
  },
  saveTemplateTagsInput: {
    minHeight: 40,
  },
  saveTemplateTagsInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveTemplateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    marginRight: 8,
  },
  saveTemplateTagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  saveTemplateTagInput: {
    minWidth: 100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#fff',
    fontSize: 12,
  },
  overviewSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  overviewSaveButtonText: {
    color: '#22d3ee',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Add Exercise
  addExerciseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  addExerciseModal: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  addExerciseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  addExerciseInputContainer: {
    position: 'relative',
  },
  addExerciseInput: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#fff',
    fontSize: 18,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    marginTop: 8,
    zIndex: 30,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 16,
  },
  addExerciseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addExerciseButton: {
    flex: 1,
  },
  addExerciseCancel: {
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },

  // Empty Workout
  emptyWorkout: {
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyWorkoutIcon: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyWorkoutTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  emptyWorkoutSubtitle: {
    color: '#64748b',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 32,
  },
  emptyWorkoutActions: {
    width: '100%',
    gap: 16,
  },
  emptyWorkoutButton: {
    width: '100%',
    paddingVertical: 24,
  },
  emptyWorkoutCustom: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyWorkoutCustomText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 1,
  },

  // Workout Container
  workoutContainer: {
    gap: 24,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  workoutDots: {
    flexDirection: 'row',
    gap: 4,
  },
  workoutDot: {
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e293b',
  },
  workoutDotActive: {
    width: 32,
    backgroundColor: '#f97316',
  },
  workoutHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  workoutHeaderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },

  // Workout List
  workoutList: {
    gap: 16,
  },
  workoutListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutListItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  workoutListItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutListItemSets: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  workoutListActions: {
    gap: 12,
    marginTop: 32,
  },
  finishButton: {
    width: '100%',
    backgroundColor: '#10b981',
    borderColor: '#34d399',
  },
  abortButton: {
    width: '100%',
    paddingVertical: 12,
  },
  abortButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(244, 63, 94, 0.5)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Workout Focus
  workoutFocus: {
    gap: 24,
  },
  workoutFocusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutNavButton: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: '#1e293b',
  },
  workoutNavButtonDisabled: {
    opacity: 0.3,
  },
  workoutFocusTitle: {
    alignItems: 'center',
    flex: 1,
  },
  workoutFocusTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  workoutFocusSubtitle: {
    fontSize: 10,
    color: '#f97316',
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginTop: 4,
  },
  workoutSets: {
    gap: 12,
  },
  workoutSet: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 16,
  },
  workoutSetCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  workoutSetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  workoutSetNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutSetNumberCompleted: {
    backgroundColor: '#10b981',
  },
  workoutSetNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  workoutSetDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e293b',
  },
  workoutSetCheck: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutSetCheckCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  workoutSetControls: {
    flexDirection: 'row',
    gap: 16,
  },
  workoutSetCompletedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  workoutSetCompletedText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#10b981',
  },
  addSetButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addSetButtonText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  workoutFocusActions: {
    gap: 12,
    paddingTop: 16,
  },
  nextButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButton: {
    width: '100%',
    backgroundColor: '#10b981',
    borderColor: '#34d399',
  },

  // Overview Screen
  overviewContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overviewSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  overviewCloseButton: {
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  overviewList: {
    flex: 1,
  },
  overviewListContent: {
    gap: 12,
    paddingBottom: 24,
  },
  overviewExerciseCard: {
    padding: 16,
  },
  overviewExerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewExerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewExerciseNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  overviewExerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  overviewExerciseNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  overviewExerciseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  overviewActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewActionButtonDisabled: {
    opacity: 0.3,
  },
  overviewActionButtonDelete: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  overviewActions: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  overviewAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#334155',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  overviewAddButtonText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overviewStartButton: {
    width: '100%',
  },
  backToOverviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginRight: 8,
  },
  backToOverviewText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Challenges View
  challengesView: {
    flex: 1,
  },
  challengesViewContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
    marginTop: 8,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyCardText: {
    color: '#64748b',
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  challengeDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },

  // Steps View
  stepsView: {
    flex: 1,
  },
  stepsViewContent: {
    paddingBottom: 24,
  },
  stepsCard: {
    padding: 32,
    alignItems: 'center',
  },
  stepsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  stepsLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
  },

  // Home View
  homeView: {
    flex: 1,
  },
  homeViewContent: {
    paddingBottom: 24,
  },
  homeCard: {
    padding: 24,
    marginBottom: 24,
  },
  homeCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  homeCardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  homeQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
  },
  homeQuickActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f97316',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Stats View
  statsView: {
    flex: 1,
  },
  statsViewContent: {
    paddingBottom: 24,
  },
  statsCard: {
    padding: 24,
    marginBottom: 16,
  },
  statsCardTitle: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  statsCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },

  // Nav Bar
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  navItemIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22d3ee',
  },
});
