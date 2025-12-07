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
  Flame,
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
  Clock,
  Hash,
  Weight,
  Share2,
  Star,
  Octagon,
  Shield,
  Hexagon,
  List,
  Maximize2,
  Edit3,
  History,
  LogOut,
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

// --- Supabase Imports ---
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseConfig } from './supabase.config';

// Initialize Supabase
const supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// --- Assets ---
const ASSETS = {
  neonDumbbell: "https://storage.googleapis.com/s.mkswft.com/RmlsZTo0ZmE5ODk2ZS02N2VjLTQyMzUtYTg0MS0yN2U1OTU0OTAzNjg=/neon_dumbbell.png",
  cyberHeart: "https://storage.googleapis.com/s.mkswft.com/RmlsZTpjN2Y4ODkzNy05N2VjLTQyMzUtYTg0MS0yN2U1OTU0OTAzNjg=/cyber_heart.png",
  background: "https://storage.googleapis.com/s.mkswft.com/RmlsZTpmZTA1YjU3ZS0zODQ5LTQ2ODktOTI4MS02ZjM4NTVhZmFiZWY=/hyperfit_bg.png"
};

// --- Constants ---
const RANKS = [
  { level: 1, title: "INITIATE", minXp: 0, color: "#94a3b8" },
  { level: 5, title: "KINETIC", minXp: 5000, color: "#fb923c" },
  { level: 10, title: "VOLTAGE", minXp: 15000, color: "#fbbf24" },
  { level: 20, title: "OVERDRIVE", minXp: 50000, color: "#fb7185" },
  { level: 50, title: "TITAN", minXp: 200000, color: "#34d399" },
  { level: 100, title: "HYPER GOD", minXp: 1000000, color: "#22d3ee" },
];

const CHALLENGE_LIBRARY = [
  { id: 'pushup_30', title: 'PUSH PROTOCOL', description: 'Upper body strength progression.', icon: '⚡', color: 'orange', totalDays: 30, type: 'reps', mode: 'progressive', baseReps: 10, increment: 2, restFreq: 4 },
  { id: 'squat_30', title: 'IRON LEGS', description: 'High volume lower body hypertrophy.', icon: '🦵', color: 'emerald', totalDays: 30, type: 'reps', mode: 'progressive', baseReps: 20, increment: 5, restFreq: 5 },
  { id: 'plank_14', title: 'CORE STABILITY', description: 'System stability update.', icon: '🛡️', color: 'indigo', totalDays: 14, type: 'time', mode: 'progressive', baseReps: 30, increment: 10, restFreq: 3 }
];

const WORKOUT_TEMPLATES = [
  { id: 'push_day', name: 'Push Day', icon: '🔥', description: 'Chest, Shoulders & Triceps.', exercises: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Lateral Raises', 'Tricep Dips'] },
  { id: 'pull_day', name: 'Pull Day', icon: '🦍', description: 'Back & Biceps.', exercises: ['Deadlift', 'Pull Ups', 'Barbell Rows', 'Face Pulls', 'Bicep Curls'] },
  { id: 'leg_day', name: 'Leg Day', icon: '🦕', description: 'Quads, Hamstrings & Glutes.', exercises: ['Squats', 'Leg Press', 'Romanian Deadlift', 'Leg Extensions', 'Calf Raises'] },
  { id: 'abs_core', name: 'Core', icon: '🧱', description: 'Stability and strength.', exercises: ['Plank', 'Russian Twists', 'Leg Raises', 'Cable Crunches'] }
];

const DEFAULT_EXERCISES = [
  'Squats', 'Bench Press', 'Deadlift', 'Overhead Press', 'Pull Ups', 'Dumbbell Rows', 'Lunges', 'Plank', 'Bicep Curls', 'Tricep Dips', 'Leg Press', 'Lat Pulldowns', 'Pushups', 'Shoulder Press', 'Glute Bridges', 'Russian Twists', 'Mountain Climbers', 'Burpees', 'Leg Extensions', 'Hamstring Curls'
];

const DEFAULT_DATA = {
  stepsToday: 2500,
  gymLogs: [],
  workouts: {},
  workoutStatus: {},
  activeChallenges: [],
  customTemplates: [],
  customChallenges: [],
  pushupsCompleted: []
};

// --- Helpers ---
const getExerciseConfig = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('plank') || lower.includes('hold') || lower.includes('static') || lower.includes('wall sit')) {
    return { type: 'timed', weightLabel: 'LBS (OPT)', repLabel: 'TIME (S)', repIcon: Clock, weightPlaceholder: '-', repPlaceholder: '30s', weightStep: 5, repStep: 10 };
  }
  if (lower.includes('pushup') || lower.includes('pull up') || lower.includes('chin up') || lower.includes('dip') || lower.includes('burpee') || lower.includes('lunge') || (lower.includes('squat') && !lower.includes('barbell'))) {
    if (name === 'Squats') return { type: 'weighted', weightLabel: 'LBS', repLabel: 'REPS', repIcon: Hash, weightPlaceholder: '135', repPlaceholder: '10', weightStep: 5, repStep: 1 };
    return { type: 'bodyweight', weightLabel: 'LBS (OPT)', repLabel: 'REPS', repIcon: Hash, weightPlaceholder: 'BW', repPlaceholder: '12', weightStep: 5, repStep: 1 };
  }
  return { type: 'weighted', weightLabel: 'LBS', repLabel: 'REPS', repIcon: Hash, weightPlaceholder: '45', repPlaceholder: '10', weightStep: 5, repStep: 1 };
};

const isExerciseEmpty = (exercise: any) => {
  if (!exercise || !exercise.sets) return true;
  return !exercise.sets.some((s: any) => s.completed || (s.weight && String(s.weight).trim() !== '') || (s.reps && String(s.reps).trim() !== ''));
};

const calculateXP = (data: any) => {
  if (!data) return 0;
  let xp = 0;
  const allWorkouts = Object.values(data.workouts || {}).flat();
  xp += (data.gymLogs?.length || 0) * 100;
  allWorkouts.forEach((ex: any) => {
    if (ex.sets) {
      ex.sets.forEach((s: any) => {
        if (s.completed && s.weight && s.reps) xp += (parseInt(s.weight) * parseInt(s.reps)) * 0.05;
        if (s.completed && (!s.weight || s.weight === '')) xp += (parseInt(s.reps) || 0) * 2;
      });
    }
  });
  return Math.floor(xp);
};

const getRank = (xp: number) => {
  const safeXp = xp || 0;
  return [...RANKS].reverse().find(r => safeXp >= r.minXp) || RANKS[0];
};

// --- UI Components ---
const GlassCard = ({ children, style, onPress, noPadding = false }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[
      styles.glassCard,
      noPadding && styles.glassCardNoPadding,
      onPress && styles.glassCardPressable,
      style,
    ]}
  >
    {children}
  </TouchableOpacity>
);

const NeonButton = ({ children, onPress, variant = 'primary', style, disabled }: any) => {
  const baseStyle = [styles.neonButton, styles.neonButtonBase];
  const variants: any = {
    primary: styles.neonButtonPrimary,
    secondary: styles.neonButtonSecondary,
    danger: styles.neonButtonDanger,
    ghost: styles.neonButtonGhost,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[baseStyle, variants[variant], disabled && styles.neonButtonDisabled, style]}
      activeOpacity={0.8}
    >
      <View style={styles.neonButtonContent}>
        {typeof children === 'string' ? (
          <Text style={[styles.neonButtonText, variant === 'primary' && styles.neonButtonTextPrimary]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </TouchableOpacity>
  );
};

const NumberControl = ({ value, onChange, step = 1, label, placeholder }: any) => {
  const safeValue = value === '' ? 0 : parseInt(value);
  return (
    <View style={styles.numberControl}>
      <Text style={styles.numberControlLabel}>{label}</Text>
      <View style={styles.numberControlContainer}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(0, safeValue - step) === 0 ? '' : Math.max(0, safeValue - step))}
          style={styles.numberControlButton}
        >
          <Minus size={16} color="#94a3b8" />
        </TouchableOpacity>
        <TextInput
          style={styles.numberControlInput}
          value={String(value)}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          onChangeText={(text) => onChange(text)}
        />
        <TouchableOpacity
          onPress={() => onChange(safeValue + step)}
          style={styles.numberControlButton}
        >
          <Plus size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ProgressRing = ({ radius, stroke, progress, color }: any) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <View style={{ width: radius * 2, height: radius * 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{Math.round(progress)}%</Text>
    </View>
  );
};

const Header = ({ streak = 0, xp = 0, onLogout, username }: any) => {
  const currentRank = getRank(xp);
  const nextRank = RANKS.find(r => r.minXp > xp);
  const range = nextRank ? nextRank.minXp - currentRank.minXp : 1;
  const progress = nextRank ? ((xp - currentRank.minXp) / range) * 100 : 100;

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo}>
            <Hexagon size={24} color="#0f172a" strokeWidth={3} />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              HYPER<Text style={styles.headerTitleAccent}>FIT</Text>
            </Text>
            <View style={styles.headerRank}>
              <Text style={[styles.headerRankText, { color: currentRank.color }]}>
                {username || currentRank.title}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakContainer}>
            <Flame size={16} color={streak > 0 ? "#f97316" : "#475569"} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <LogOut size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

const SimpleBarChart = ({ data, color = "#f97316" }: any) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyText}>NO DATA DETECTED</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d: any) => d.value));
  
  return (
    <View style={styles.chartContainer}>
      {data.map((item: any, i: number) => (
        <View key={i} style={styles.chartBarWrapper}>
          <View style={styles.chartBarContainer}>
            <View
              style={[
                styles.chartBar,
                { backgroundColor: color, height: `${maxVal > 0 ? (item.value / maxVal) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.chartLabel}>{item.label.slice(0, 3)}</Text>
        </View>
      ))}
    </View>
  );
};

// --- Application Views ---
const LoginView = ({ onEmailLogin, onGoogleLogin, onSignUp }: any) => {
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

const GymView = ({ data, updateData, user }: any) => {
  const today = new Date().toISOString().split('T')[0];
  const isCheckedIn = data.gymLogs.includes(today);
  const isFinished = data.workoutStatus?.[today]?.finished || false;
  const [newExerciseName, setNewExerciseName] = useState('');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [viewMode, setViewMode] = useState('focus');
  const [showOverview, setShowOverview] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);
  const todaysWorkout = data.workouts?.[today] || [];
  const visibleWorkout = todaysWorkout.filter((ex: any) => !ex.archived);
  const customTemplates = data.customTemplates || [];
  const [collapsedExercises, setCollapsedExercises] = useState<string[]>([]);
  
  // Template management state
  const [templates, setTemplates] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null | undefined>(undefined);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTemplateFolder, setSaveTemplateFolder] = useState<string | null>(null);
  const [saveTemplateTags, setSaveTemplateTags] = useState<string[]>([]);
  const saveTemplateTagInputRef = useRef<TextInput | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (visibleWorkout.length > 0 && currentExIndex >= visibleWorkout.length) {
      setCurrentExIndex(Math.max(0, visibleWorkout.length - 1));
    }
  }, [visibleWorkout.length]);

  // Fetch templates from Supabase
  useEffect(() => {
    if (!user || !showTemplatePicker) return;
    fetchTemplates();
    fetchFolders();
    fetchFavorites();
  }, [user, showTemplatePicker]);

  const fetchTemplates = async () => {
    if (!user) return;
    setLoadingTemplates(true);
    try {
      // Fetch user's templates and public/standard templates
      const { data: userTemplates, error: userError } = await supabase
        .from('workout_templates')
        .select('*')
        .or(`user_id.eq.${user.id},is_standard.eq.true,is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Extract unique tags from all templates
      const tagsSet = new Set<string>();
      userTemplates?.forEach((t: any) => {
        if (t.tags && Array.isArray(t.tags)) {
          t.tags.forEach((tag: string) => tagsSet.add(tag));
        }
      });
      setAllTags(Array.from(tagsSet).sort());

      setTemplates(userTemplates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Fallback to local templates
      setTemplates([...WORKOUT_TEMPLATES, ...customTemplates]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchFolders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('workout_template_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_template_favorites')
        .select('template_id')
        .eq('user_id', user.id);

      if (error) throw error;
      const favoriteIds = new Set(data?.map((f: any) => f.template_id) || []);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const saveTemplateToSupabase = async (name: string, exercises: string[], folderId?: string | null, tags?: string[]) => {
    if (!user) return;
    try {
      const username = user.email?.split('@')[0] || user.user_metadata?.full_name || 'User';
      const { data, error } = await supabase
        .from('workout_templates')
        .insert({
          user_id: user.id,
          name: name,
          description: `${exercises.length} Exercises`,
          icon: '💾',
          exercises: exercises,
          created_by_username: username,
          folder_id: folderId || null,
          tags: tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      await fetchTemplates();
      return data;
    } catch (error) {
      console.error('Error saving template:', error);
      // Fallback to local storage
      const newTemplate = {
        id: Date.now(),
        name: name,
        icon: '💾',
        description: `${exercises.length} Exercises`,
        exercises: exercises
      };
      updateData({ ...data, customTemplates: [newTemplate, ...customTemplates] });
      throw error;
    }
  };

  const toggleFavorite = async (templateId: string) => {
    if (!user) return;
    try {
      const isFavorite = favorites.has(templateId);
      if (isFavorite) {
        const { error } = await supabase
          .from('user_template_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('template_id', templateId);
        if (error) throw error;
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(templateId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('user_template_favorites')
          .insert({
            user_id: user.id,
            template_id: templateId,
          });
        if (error) throw error;
        setFavorites(prev => new Set([...prev, templateId]));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      if (user) {
        await supabase.from('workout_templates').delete().eq('id', templateId).eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const confirmDeleteTemplate = (templateId: string) => {
    Alert.alert('Delete Template', 'Remove this template permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(templateId) },
    ]);
  };

  const duplicateTemplate = (template: any) => {
    const duplicated = {
      ...template,
      id: `local-${Date.now()}`,
      name: `${template.name} (Copy)`,
      user_id: user?.id,
    };
    setTemplates(prev => [duplicated, ...prev]);
  };

  const shareTemplate = (template: any) => {
    Alert.alert('Share Template', `${template.name}\n${template.description || ''}`);
  };

  const createFolder = async (name: string, color: string = '#f97316', icon: string = '📁') => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('workout_template_folders')
        .insert({
          user_id: user.id,
          name: name,
          color: color,
          icon: icon,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchFolders();
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', 'Failed to create folder');
    }
  };

  const getAllExerciseNames = () => {
    const historyNames = Object.values(data.workouts || {}).flat().map((w: any) => w.name);
    const uniqueNames = [...new Set([...DEFAULT_EXERCISES, ...historyNames])];
    return uniqueNames.sort();
  };

  const handleNameChange = (val: string) => {
    setNewExerciseName(val);
    if (val.length > 0) {
      const allNames = getAllExerciseNames();
      const filtered = allNames.filter(name => name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (name: string) => {
    setNewExerciseName(name);
    setSuggestions([]);
  };

  const toggleCheckIn = () => {
    let newLogs = isCheckedIn ? data.gymLogs.filter((d: string) => d !== today) : [...data.gymLogs, today];
    updateData({ ...data, gymLogs: newLogs });
  };

  const applyTemplate = (template: any) => {
    const newExercises = template.exercises.map((name: string, index: number) => ({
      id: Date.now() + index + Math.random(),
      name: name,
      sets: [{ id: Date.now() + index + 100, weight: '', reps: '', completed: false }]
    }));
    const updatedWorkouts = { ...data.workouts, [today]: [...todaysWorkout, ...newExercises] };
    const newLogs = !isCheckedIn ? [...data.gymLogs, today] : data.gymLogs;
    updateData({ ...data, workouts: updatedWorkouts, gymLogs: newLogs });
    setShowTemplatePicker(false);
    setShowOverview(true);
    setIsSessionActive(false);
  };

  const saveCurrentAsTemplate = async () => {
    if (!templateName.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }
    if (visibleWorkout.length === 0) {
      Alert.alert('Error', 'Cannot save empty workout');
      return;
    }
    try {
      const exercises = visibleWorkout.map((ex: any) => ex.name);
      await saveTemplateToSupabase(templateName, exercises, saveTemplateFolder, saveTemplateTags);
      Alert.alert('Success', 'Template saved successfully');
      setTemplateName('');
      setSaveTemplateFolder(null);
      setSaveTemplateTags([]);
      setShowSaveTemplateModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save template');
    }
  };

  // Filter templates based on search, folder, favorites, and tags
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by search query
    if (templateSearchQuery.trim()) {
      const query = templateSearchQuery.toLowerCase();
      filtered = filtered.filter((t: any) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.created_by_username?.toLowerCase().includes(query) ||
        t.exercises?.some((ex: string) => ex.toLowerCase().includes(query))
      );
    }

    // Filter by folder
    if (selectedFolder) {
      filtered = filtered.filter((t: any) => t.folder_id === selectedFolder);
    } else if (selectedFolder === null && showTemplatePicker) {
      // Show only templates without folders when "No Folder" is selected
      // This is handled in the UI
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter((t: any) => favorites.has(t.id));
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((t: any) =>
        t.tags && Array.isArray(t.tags) &&
        selectedTags.some(tag => t.tags.includes(tag))
      );
    }

    return filtered;
  }, [templates, templateSearchQuery, selectedFolder, showFavoritesOnly, selectedTags, favorites]);

  const addExercise = (position: 'top' | 'bottom' = 'bottom') => {
    if (!newExerciseName.trim()) return;
    const newExercise = {
      id: Date.now(),
      name: newExerciseName,
      sets: [{ id: Date.now() + 1, weight: '', reps: '', completed: false }]
    };
    const updatedList = position === 'top' ? [newExercise, ...todaysWorkout] : [...todaysWorkout, newExercise];
    const newLogs = !isCheckedIn ? [...data.gymLogs, today] : data.gymLogs;
    updateData({ ...data, workouts: { ...data.workouts, [today]: updatedList }, gymLogs: newLogs });
    setNewExerciseName('');
    setIsAddingExercise(false);
    setEditingExerciseId(null);
    // Show overview if not in session
    if (!isSessionActive && visibleWorkout.length === 0) {
      setShowOverview(true);
    }
    if (position === 'bottom') setCurrentExIndex(visibleWorkout.length);
    else setCurrentExIndex(0);
  };

  const startSession = () => {
    if (visibleWorkout.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise before starting the session.');
      return;
    }
    setIsSessionActive(true);
    setShowOverview(false);
    setCurrentExIndex(0);
    setViewMode('focus');
  };

  const editExerciseName = (exId: number, newName: string) => {
    const realIndex = todaysWorkout.findIndex((ex: any) => ex.id === exId);
    if (realIndex === -1) return;
    const updated = [...todaysWorkout];
    updated[realIndex].name = newName;
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
    setEditingExerciseId(null);
  };

  const updateSet = (exId: number, setIndex: number, field: string, value: any) => {
    const realIndex = todaysWorkout.findIndex((ex: any) => ex.id === exId);
    if (realIndex === -1) return;
    const updated = [...todaysWorkout];
    updated[realIndex].sets[setIndex][field] = value;
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
  };

  const addSet = (exId: number) => {
    const realIndex = todaysWorkout.findIndex((ex: any) => ex.id === exId);
    if (realIndex === -1) return;
    const updated = [...todaysWorkout];
    const prev = updated[realIndex].sets[updated[realIndex].sets.length - 1];
    updated[realIndex].sets.push({
      id: Date.now(),
      weight: prev ? prev.weight : '',
      reps: '',
      completed: false
    });
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
  };

  const deleteExercise = (exId: number) => {
    const updated = todaysWorkout.filter((ex: any) => ex.id !== exId);
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
  };

  const moveExercise = (exId: number, direction: 'up' | 'down') => {
    const realIndex = todaysWorkout.findIndex((ex: any) => ex.id === exId);
    if (realIndex === -1) return;
    const updated = [...todaysWorkout];
    if (direction === 'up' && realIndex > 0) {
      [updated[realIndex - 1], updated[realIndex]] = [updated[realIndex], updated[realIndex - 1]];
    } else if (direction === 'down' && realIndex < updated.length - 1) {
      [updated[realIndex + 1], updated[realIndex]] = [updated[realIndex], updated[realIndex + 1]];
    }
    updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
  };

  const finishWorkout = () => {
    const cleanedWorkout = todaysWorkout.filter((ex: any) => ex.archived || !isExerciseEmpty(ex));
    updateData({
      ...data,
      workouts: { ...data.workouts, [today]: cleanedWorkout },
      workoutStatus: { ...data.workoutStatus, [today]: { finished: true, finishedAt: new Date().toISOString() } }
    });
    setIsSessionActive(false);
    setShowOverview(false);
  };

  const undoFinish = () => {
    updateData({ ...data, workoutStatus: { ...data.workoutStatus, [today]: { finished: false } } });
    setShowOverview(true);
    setIsSessionActive(false);
  };

  const startNewSession = () => {
    const cleanedAndArchived = todaysWorkout.filter((ex: any) => ex.archived || !isExerciseEmpty(ex)).map((ex: any) => ({ ...ex, archived: true }));
    updateData({
      ...data,
      workouts: { ...data.workouts, [today]: cleanedAndArchived },
      workoutStatus: { ...data.workoutStatus, [today]: { finished: false } }
    });
    setIsSessionActive(false);
    setShowOverview(false);
    setTimeout(() => setShowTemplatePicker(true), 100);
  };

  const abortSession = () => {
    Alert.alert('Discard Session', 'Discard current session? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          const preservedWorkouts = todaysWorkout.filter((ex: any) => ex.archived);
          updateData({ ...data, workouts: { ...data.workouts, [today]: preservedWorkouts } });
          setIsAddingExercise(false);
          setShowTemplatePicker(false);
          setNewExerciseName('');
          setSuggestions([]);
        }
      }
    ]);
  };

  const calculateTotalVolume = () => {
    return visibleWorkout.reduce((acc: number, ex: any) => {
      return acc + ex.sets.reduce((sAcc: number, s: any) => {
        return sAcc + (s.completed && s.weight && s.reps ? parseInt(s.weight) * parseInt(s.reps) : 0);
      }, 0);
    }, 0);
  };

  const currentExercise = visibleWorkout[currentExIndex];

  if (isFinished) {
    return (
      <ScrollView contentContainerStyle={styles.finishedContainer}>
        <View style={styles.finishedIcon}>
          <Medal size={48} color="#22d3ee" />
        </View>
        <View style={styles.finishedText}>
          <Text style={styles.finishedTitle}>SESSION COMPLETE</Text>
          <Text style={styles.finishedSubtitle}>DATA UPLOADED SUCCESSFULLY</Text>
        </View>
        <View style={styles.finishedStats}>
          <GlassCard style={styles.finishedStatCard}>
            <Text style={styles.finishedStatValue}>{visibleWorkout.length}</Text>
            <Text style={styles.finishedStatLabel}>Exercises</Text>
          </GlassCard>
          <GlassCard style={styles.finishedStatCard}>
            <Text style={styles.finishedStatValue}>{calculateTotalVolume().toLocaleString()}</Text>
            <Text style={styles.finishedStatLabel}>Vol. Load (LB)</Text>
          </GlassCard>
        </View>
        <View style={styles.finishedActions}>
          <NeonButton onPress={startNewSession} style={styles.finishedButton}>
            <PlusCircle size={18} color="#0f172a" />
            <Text style={{ marginLeft: 8 }}>INITIATE NEW SESSION</Text>
          </NeonButton>
          <TouchableOpacity onPress={undoFinish} style={styles.finishedUndo}>
            <RotateCcw size={12} color="#64748b" />
            <Text style={styles.finishedUndoText}>MODIFY LOG DATA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      {showTemplatePicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showTemplatePicker}
          onRequestClose={() => setShowTemplatePicker(false)}
          statusBarTranslucent
          presentationStyle="fullScreen"
        >
          <SafeAreaView style={styles.templateModalSafeArea}>
            <View style={styles.templatePickerOverlay}>
              <View style={styles.templatePicker}>
                <View style={styles.templatePickerHeader}>
                  <View>
                    <Text style={styles.templatePickerTitle}>WORKOUT TEMPLATES</Text>
                    <Text style={styles.templatePickerSubtitle}>
                      {filteredTemplates.length} {filteredTemplates.length === 1 ? 'TEMPLATE' : 'TEMPLATES'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowTemplatePicker(false)} style={styles.templatePickerClose}>
                    <X size={24} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.templateSearchContainer}>
                  <Search size={20} color="#64748b" />
                  <TextInput
                    style={styles.templateSearchInput}
                    placeholder="Search templates..."
                    placeholderTextColor="#64748b"
                    value={templateSearchQuery}
                    onChangeText={setTemplateSearchQuery}
                  />
                  {templateSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setTemplateSearchQuery('')}>
                      <X size={16} color="#64748b" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter Bar */}
                <View style={styles.templateFilterBar}>
                  <TouchableOpacity
                    onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    style={[styles.templateFilterButton, showFavoritesOnly && styles.templateFilterButtonActive]}
                  >
                    <Heart size={16} color={showFavoritesOnly ? "#f97316" : "#64748b"} fill={showFavoritesOnly ? "#f97316" : "none"} />
                    <Text style={[styles.templateFilterText, showFavoritesOnly && styles.templateFilterTextActive]}>
                      FAVORITES
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (selectedFolder === undefined) {
                        setSelectedFolder(null);
                      } else if (selectedFolder === null) {
                        setSelectedFolder(undefined);
                      } else {
                        setSelectedFolder(undefined);
                      }
                    }}
                    style={[styles.templateFilterButton, selectedFolder !== undefined && styles.templateFilterButtonActive]}
                  >
                    <Folder size={16} color={selectedFolder !== undefined ? "#f97316" : "#64748b"} />
                    <Text style={[styles.templateFilterText, selectedFolder !== undefined && styles.templateFilterTextActive]}>
                      FOLDERS
                    </Text>
                  </TouchableOpacity>

                  {selectedTags.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSelectedTags([])}
                      style={styles.templateFilterButton}
                    >
                      <Tag size={16} color="#f97316" />
                      <Text style={styles.templateFilterTextActive}>{selectedTags.length} TAG{selectedTags.length > 1 ? 'S' : ''}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Folder Selector */}
                {selectedFolder !== undefined && (
                  <ScrollView horizontal style={styles.templateFolderSelector} showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      onPress={() => setSelectedFolder(null)}
                      style={[styles.templateFolderChip, selectedFolder === null && styles.templateFolderChipActive]}
                    >
                      <Text style={[styles.templateFolderChipText, selectedFolder === null && styles.templateFolderChipTextActive]}>
                        NO FOLDER
                      </Text>
                    </TouchableOpacity>
                    {folders.map((folder: any) => (
                      <TouchableOpacity
                        key={folder.id}
                        onPress={() => setSelectedFolder(folder.id)}
                        style={[styles.templateFolderChip, selectedFolder === folder.id && styles.templateFolderChipActive]}
                      >
                        <Text style={styles.templateFolderIcon}>{folder.icon || '📁'}</Text>
                        <Text style={[styles.templateFolderChipText, selectedFolder === folder.id && styles.templateFolderChipTextActive]}>
                          {folder.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setShowCreateFolderModal(true)}
                      style={[styles.templateFolderChip, styles.templateFolderChipNew]}
                    >
                      <FolderPlus size={16} color="#f97316" />
                      <Text style={[styles.templateFolderChipText, { color: '#f97316' }]}>NEW</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}

                {/* Tags Selector */}
                {allTags.length > 0 && (
                  <ScrollView horizontal style={styles.templateTagsSelector} showsHorizontalScrollIndicator={false}>
                    {allTags.map((tag: string) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedTags(selectedTags.filter(t => t !== tag));
                            } else {
                              setSelectedTags([...selectedTags, tag]);
                            }
                          }}
                          style={[styles.templateTagChip, isSelected && styles.templateTagChipActive]}
                        >
                          <Tag size={12} color={isSelected ? "#0f172a" : "#64748b"} />
                          <Text style={[styles.templateTagChipText, isSelected && styles.templateTagChipTextActive]}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Template List */}
                <ScrollView
                  style={styles.templatePickerList}
                  contentContainerStyle={styles.templatePickerListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {loadingTemplates ? (
                    <View style={styles.templateLoadingContainer}>
                      <ActivityIndicator size="large" color="#f97316" />
                      <Text style={styles.templateLoadingText}>LOADING TEMPLATES...</Text>
                    </View>
                  ) : filteredTemplates.length === 0 ? (
                    <View style={styles.templateEmptyContainer}>
                      <Text style={styles.templateEmptyText}>NO TEMPLATES FOUND</Text>
                      <Text style={styles.templateEmptySubtext}>Try adjusting your filters</Text>
                    </View>
                  ) : (
                    filteredTemplates.map((template: any) => {
                      const isFavorite = favorites.has(template.id);
                      const folder = folders.find((f: any) => f.id === template.folder_id);
                      const isUserTemplate = template.user_id === user?.id;
                      const isStandard = template.is_standard;

                      return (
                        <GlassCard key={template.id} style={styles.templateCard}>
                          <TouchableOpacity
                            onPress={() => applyTemplate(template)}
                            style={styles.templateCardContent}
                          >
                            <Text style={styles.templateIcon}>{template.icon || '💪'}</Text>
                            <View style={styles.templateInfo}>
                              <View style={styles.templateHeaderRow}>
                                <Text style={styles.templateName}>{template.name}</Text>
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(template.id);
                                  }}
                                  style={styles.templateFavoriteButton}
                                >
                                  <Heart
                                    size={18}
                                    color={isFavorite ? "#f97316" : "#64748b"}
                                    fill={isFavorite ? "#f97316" : "none"}
                                  />
                                </TouchableOpacity>
                              </View>
                              <Text style={styles.templateDescription}>
                                {template.description || `${template.exercises?.length || 0} Exercises`}
                              </Text>
                              <View style={styles.templateMetaRow}>
                                {isStandard && (
                                  <View style={styles.templateBadge}>
                                    <Text style={styles.templateBadgeText}>STANDARD</Text>
                                  </View>
                                )}
                                {!isStandard && template.created_by_username && (
                                  <View style={styles.templateBadge}>
                                    <User size={10} color="#64748b" />
                                    <Text style={styles.templateBadgeText}>{template.created_by_username}</Text>
                                  </View>
                                )}
                                {folder && (
                                  <View style={[styles.templateBadge, { backgroundColor: folder.color + '20' }]}>
                                    <Text style={styles.templateFolderIcon}>{folder.icon || '📁'}</Text>
                                    <Text style={[styles.templateBadgeText, { color: folder.color }]}>{folder.name}</Text>
                                  </View>
                                )}
                                {template.tags && template.tags.length > 0 && (
                                  <View style={styles.templateTagsRow}>
                                    {template.tags.slice(0, 2).map((tag: string, idx: number) => (
                                      <View key={idx} style={styles.templateTagBadge}>
                                        <Tag size={8} color="#64748b" />
                                        <Text style={styles.templateTagBadgeText}>{tag}</Text>
                                      </View>
                                    ))}
                                    {template.tags.length > 2 && (
                                      <Text style={styles.templateTagMore}>+{template.tags.length - 2}</Text>
                                    )}
                                  </View>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                          <View style={styles.templateActions}>
                            {isUserTemplate && (
                              <>
                                <TouchableOpacity
                                  onPress={() => {
                                    setTemplateName(template.name);
                                    setSaveTemplateFolder(template.folder_id || null);
                                    setSaveTemplateTags(template.tags || []);
                                    setShowSaveTemplateModal(true);
                                  }}
                                  style={styles.templateActionButton}
                                >
                                  <Edit3 size={16} color="#22d3ee" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => confirmDeleteTemplate(template.id)}
                                  style={styles.templateActionButton}
                                >
                                  <Trash2 size={16} color="#ef4444" />
                                </TouchableOpacity>
                              </>
                            )}
                            {!isStandard && (
                              <TouchableOpacity
                                onPress={() => duplicateTemplate(template)}
                                style={styles.templateActionButton}
                              >
                                <Copy size={16} color="#f97316" />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() => shareTemplate(template)}
                              style={styles.templateActionButton}
                            >
                              <Share2 size={16} color="#22d3ee" />
                            </TouchableOpacity>
                          </View>
                        </GlassCard>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}

      <ScrollView style={styles.gymView} contentContainerStyle={styles.gymViewContent}>
        {isAddingExercise && (
          <View style={styles.addExerciseOverlay}>
            <View style={styles.addExerciseModal}>
              <Text style={styles.addExerciseTitle}>ADD EXERCISE</Text>
            <View style={styles.addExerciseInputContainer}>
              <TextInput
                autoFocus
                style={styles.addExerciseInput}
                placeholder="Search..."
                placeholderTextColor="#64748b"
                value={newExerciseName}
                onChangeText={handleNameChange}
                onSubmitEditing={() => addExercise()}
              />
              {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {suggestions.map((s, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => selectSuggestion(s)}
                      style={styles.suggestionItem}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.addExerciseActions}>
              <NeonButton onPress={() => addExercise('bottom')} style={styles.addExerciseButton}>
                <Text>ADD</Text>
              </NeonButton>
              <TouchableOpacity onPress={() => setIsAddingExercise(false)} style={styles.addExerciseCancel}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showSaveTemplateModal && (
        <View style={styles.addExerciseOverlay}>
          <View style={styles.addExerciseModal}>
            <View style={styles.saveTemplateHeader}>
              <Text style={styles.addExerciseTitle}>SAVE TEMPLATE</Text>
              <TouchableOpacity onPress={() => {
                setShowSaveTemplateModal(false);
                setTemplateName('');
                setSaveTemplateFolder(null);
                setSaveTemplateTags([]);
              }} style={styles.addExerciseCancel}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.saveTemplateSubtitle}>{visibleWorkout.length} Exercises</Text>
            
            <Text style={styles.saveTemplateLabel}>TEMPLATE NAME</Text>
            <TextInput
              style={styles.addExerciseInput}
              placeholder="Enter template name..."
              placeholderTextColor="#64748b"
              value={templateName}
              onChangeText={setTemplateName}
              autoFocus
            />

            <Text style={[styles.saveTemplateLabel, { marginTop: 16 }]}>FOLDER (OPTIONAL)</Text>
            <ScrollView horizontal style={styles.saveTemplateFolderSelector} showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => setSaveTemplateFolder(null)}
                style={[styles.templateFolderChip, !saveTemplateFolder && styles.templateFolderChipActive]}
              >
                <Text style={[styles.templateFolderChipText, !saveTemplateFolder && styles.templateFolderChipTextActive]}>
                  NO FOLDER
                </Text>
              </TouchableOpacity>
              {folders.map((folder: any) => (
                <TouchableOpacity
                  key={folder.id}
                  onPress={() => setSaveTemplateFolder(folder.id)}
                  style={[styles.templateFolderChip, saveTemplateFolder === folder.id && styles.templateFolderChipActive]}
                >
                  <Text style={styles.templateFolderIcon}>{folder.icon || '📁'}</Text>
                  <Text style={[styles.templateFolderChipText, saveTemplateFolder === folder.id && styles.templateFolderChipTextActive]}>
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.saveTemplateLabel, { marginTop: 16 }]}>TAGS (OPTIONAL)</Text>
            <View style={styles.saveTemplateTagsContainer}>
              <ScrollView
                horizontal
                style={styles.saveTemplateTagsInput}
                contentContainerStyle={styles.saveTemplateTagsInputContent}
                showsHorizontalScrollIndicator={false}
              >
                {saveTemplateTags.map((tag, idx) => (
                  <View key={idx} style={styles.saveTemplateTag}>
                    <Text style={styles.saveTemplateTagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => setSaveTemplateTags(saveTemplateTags.filter((_, i) => i !== idx))}>
                      <X size={12} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TextInput
                  ref={saveTemplateTagInputRef}
                  style={styles.saveTemplateTagInput}
                  placeholder="Add tag..."
                  placeholderTextColor="#64748b"
                  onSubmitEditing={(e) => {
                    const tag = e.nativeEvent.text.trim();
                    if (tag && !saveTemplateTags.includes(tag)) {
                      setSaveTemplateTags([...saveTemplateTags, tag]);
                    }
                    saveTemplateTagInputRef.current?.clear();
                  }}
                />
              </ScrollView>
            </View>

            <View style={styles.addExerciseActions}>
              <NeonButton onPress={saveCurrentAsTemplate} style={styles.addExerciseButton} disabled={!templateName.trim()}>
                <Save size={18} color="#0f172a" />
                <Text style={{ marginLeft: 8 }}>SAVE</Text>
              </NeonButton>
              <TouchableOpacity onPress={() => {
                setShowSaveTemplateModal(false);
                setTemplateName('');
                setSaveTemplateFolder(null);
                setSaveTemplateTags([]);
              }} style={styles.addExerciseCancel}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showCreateFolderModal && (
        <View style={styles.addExerciseOverlay}>
          <View style={styles.addExerciseModal}>
            <View style={styles.saveTemplateHeader}>
              <Text style={styles.addExerciseTitle}>CREATE FOLDER</Text>
              <TouchableOpacity onPress={() => {
                setShowCreateFolderModal(false);
                setNewFolderName('');
              }} style={styles.addExerciseCancel}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.saveTemplateLabel}>FOLDER NAME</Text>
            <TextInput
              style={styles.addExerciseInput}
              placeholder="Enter folder name..."
              placeholderTextColor="#64748b"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              onSubmitEditing={() => {
                if (newFolderName.trim()) {
                  createFolder(newFolderName.trim());
                  setShowCreateFolderModal(false);
                  setNewFolderName('');
                }
              }}
            />

            <View style={styles.addExerciseActions}>
              <NeonButton 
                onPress={() => {
                  if (newFolderName.trim()) {
                    createFolder(newFolderName.trim());
                    setShowCreateFolderModal(false);
                    setNewFolderName('');
                  }
                }} 
                style={styles.addExerciseButton} 
                disabled={!newFolderName.trim()}
              >
                <FolderPlus size={18} color="#0f172a" />
                <Text style={{ marginLeft: 8 }}>CREATE</Text>
              </NeonButton>
              <TouchableOpacity onPress={() => {
                setShowCreateFolderModal(false);
                setNewFolderName('');
              }} style={styles.addExerciseCancel}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showOverview && !isSessionActive ? (
        <View style={styles.overviewContainer}>
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.overviewTitle}>WORKOUT OVERVIEW</Text>
              <Text style={styles.overviewSubtitle}>{visibleWorkout.length} Exercises</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowOverview(false);
                const preservedWorkouts = todaysWorkout.filter((ex: any) => ex.archived);
                updateData({ ...data, workouts: { ...data.workouts, [today]: preservedWorkouts } });
              }}
              style={styles.overviewCloseButton}
            >
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.overviewList} contentContainerStyle={styles.overviewListContent}>
            {visibleWorkout.map((ex: any, index: number) => (
              <GlassCard key={ex.id} style={styles.overviewExerciseCard}>
                <View style={styles.overviewExerciseContent}>
                  <View style={styles.overviewExerciseNumber}>
                    <Text style={styles.overviewExerciseNumberText}>{index + 1}</Text>
                  </View>
                  {editingExerciseId === ex.id ? (
                    <TextInput
                      style={styles.overviewExerciseNameInput}
                      value={ex.name}
                      onChangeText={(text) => {
                        const realIndex = todaysWorkout.findIndex((e: any) => e.id === ex.id);
                        if (realIndex === -1) return;
                        const updated = [...todaysWorkout];
                        updated[realIndex].name = text;
                        updateData({ ...data, workouts: { ...data.workouts, [today]: updated } });
                      }}
                      onSubmitEditing={() => setEditingExerciseId(null)}
                      onBlur={() => setEditingExerciseId(null)}
                      autoFocus
                    />
                  ) : (
                    <Text style={styles.overviewExerciseName} onPress={() => setEditingExerciseId(ex.id)}>
                      {ex.name}
                    </Text>
                  )}
                  <View style={styles.overviewExerciseActions}>
                    <TouchableOpacity
                      onPress={() => moveExercise(ex.id, 'up')}
                      disabled={index === 0}
                      style={[styles.overviewActionButton, index === 0 && styles.overviewActionButtonDisabled]}
                    >
                      <ArrowUp size={16} color={index === 0 ? "#475569" : "#94a3b8"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveExercise(ex.id, 'down')}
                      disabled={index === visibleWorkout.length - 1}
                      style={[styles.overviewActionButton, index === visibleWorkout.length - 1 && styles.overviewActionButtonDisabled]}
                    >
                      <ArrowDown size={16} color={index === visibleWorkout.length - 1 ? "#475569" : "#94a3b8"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteExercise(ex.id)}
                      style={[styles.overviewActionButton, styles.overviewActionButtonDelete]}
                    >
                      <Trash2 size={16} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            ))}
          </ScrollView>

          <View style={styles.overviewActions}>
            <TouchableOpacity
              onPress={() => setIsAddingExercise(true)}
              style={styles.overviewAddButton}
            >
              <Plus size={20} color="#f97316" />
              <Text style={styles.overviewAddButtonText}>ADD EXERCISE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSaveTemplateModal(true)}
              style={styles.overviewSaveButton}
            >
              <Save size={20} color="#22d3ee" />
              <Text style={styles.overviewSaveButtonText}>SAVE TEMPLATE</Text>
            </TouchableOpacity>
            <NeonButton onPress={startSession} style={styles.overviewStartButton} disabled={visibleWorkout.length === 0}>
              <Play size={20} color="#0f172a" />
              <Text style={{ marginLeft: 8 }}>START SESSION</Text>
            </NeonButton>
          </View>
        </View>
      ) : visibleWorkout.length === 0 ? (
        <View style={styles.emptyWorkout}>
          <View style={styles.emptyWorkoutIcon}>
            <Dumbbell size={48} color="#475569" />
          </View>
          <Text style={styles.emptyWorkoutTitle}>SYSTEM IDLE</Text>
          <Text style={styles.emptyWorkoutSubtitle}>INITIALIZE TRAINING PROTOCOL</Text>
          <View style={styles.emptyWorkoutActions}>
            <NeonButton onPress={() => setShowTemplatePicker(true)} style={styles.emptyWorkoutButton}>
              <Layout size={24} color="#0f172a" />
              <Text style={{ marginLeft: 8 }}>LOAD TEMPLATE</Text>
            </NeonButton>
            <TouchableOpacity
              onPress={() => {
                setIsAddingExercise(true);
                setShowOverview(true);
              }}
              style={styles.emptyWorkoutCustom}
            >
              <PlusCircle size={20} color="#64748b" />
              <Text style={styles.emptyWorkoutCustomText}>CUSTOM INPUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.workoutContainer}>
          <View style={styles.workoutHeader}>
            {isSessionActive && (
              <TouchableOpacity
                onPress={() => {
                  setShowOverview(true);
                  setIsSessionActive(false);
                }}
                style={styles.backToOverviewButton}
              >
                <ChevronLeft size={20} color="#94a3b8" />
                <Text style={styles.backToOverviewText}>OVERVIEW</Text>
              </TouchableOpacity>
            )}
            <View style={styles.workoutDots}>
              {visibleWorkout.map((_: any, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.workoutDot,
                    idx === currentExIndex && styles.workoutDotActive
                  ]}
                />
              ))}
            </View>
            <View style={styles.workoutHeaderActions}>
              <TouchableOpacity
                onPress={() => setViewMode(viewMode === 'list' ? 'focus' : 'list')}
                style={styles.workoutHeaderButton}
              >
                {viewMode === 'list' ? (
                  <Maximize2 size={18} color="#94a3b8" />
                ) : (
                  <List size={18} color="#94a3b8" />
                )}
              </TouchableOpacity>
              {!isSessionActive && (
                <TouchableOpacity
                  onPress={() => setIsAddingExercise(true)}
                  style={styles.workoutHeaderButton}
                >
                  <Plus size={18} color="#f97316" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {viewMode === 'list' ? (
            <View style={styles.workoutList}>
              {visibleWorkout.map((ex: any, i: number) => (
                <GlassCard
                  key={ex.id}
                  onPress={() => {
                    setCurrentExIndex(i);
                    setViewMode('focus');
                  }}
                  style={styles.workoutListItem}
                >
                  <Text style={styles.workoutListItemName}>{ex.name}</Text>
                  <View style={styles.workoutListItemInfo}>
                    <Text style={styles.workoutListItemSets}>
                      {ex.sets.filter((s: any) => s.completed).length}/{ex.sets.length} SETS
                    </Text>
                    <ChevronRight size={16} color="#64748b" />
                  </View>
                </GlassCard>
              ))}
              <View style={styles.workoutListActions}>
                <NeonButton onPress={finishWorkout} style={styles.finishButton}>
                  <Text>FINISH WORKOUT</Text>
                </NeonButton>
                <TouchableOpacity onPress={abortSession} style={styles.abortButton}>
                  <Text style={styles.abortButtonText}>Abort Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.workoutFocus}>
              <View style={styles.workoutFocusHeader}>
                <TouchableOpacity
                  onPress={() => setCurrentExIndex(Math.max(0, currentExIndex - 1))}
                  disabled={currentExIndex === 0}
                  style={[styles.workoutNavButton, currentExIndex === 0 && styles.workoutNavButtonDisabled]}
                >
                  <ChevronLeft size={24} color={currentExIndex === 0 ? "#475569" : "#94a3b8"} />
                </TouchableOpacity>
                <View style={styles.workoutFocusTitle}>
                  <Text style={styles.workoutFocusTitleText}>{currentExercise?.name}</Text>
                  <Text style={styles.workoutFocusSubtitle}>
                    EXERCISE {currentExIndex + 1} OF {visibleWorkout.length}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setCurrentExIndex(Math.min(visibleWorkout.length - 1, currentExIndex + 1))}
                  disabled={currentExIndex === visibleWorkout.length - 1}
                  style={[
                    styles.workoutNavButton,
                    currentExIndex === visibleWorkout.length - 1 && styles.workoutNavButtonDisabled
                  ]}
                >
                  <ChevronRight size={24} color={currentExIndex === visibleWorkout.length - 1 ? "#475569" : "#94a3b8"} />
                </TouchableOpacity>
              </View>

              <View style={styles.workoutSets}>
                {currentExercise?.sets.map((set: any, setIndex: number) => {
                  const exConfig = getExerciseConfig(currentExercise.name);
                  return (
                    <View
                      key={set.id}
                      style={[
                        styles.workoutSet,
                        set.completed && styles.workoutSetCompleted
                      ]}
                    >
                      <View style={styles.workoutSetHeader}>
                        <View style={[styles.workoutSetNumber, set.completed && styles.workoutSetNumberCompleted]}>
                          <Text style={styles.workoutSetNumberText}>{setIndex + 1}</Text>
                        </View>
                        <View style={styles.workoutSetDivider} />
                        <TouchableOpacity
                          onPress={() => updateSet(currentExercise.id, setIndex, 'completed', !set.completed)}
                          style={[
                            styles.workoutSetCheck,
                            set.completed && styles.workoutSetCheckCompleted
                          ]}
                        >
                          <CheckCircle size={24} color={set.completed ? "#0f172a" : "#475569"} />
                        </TouchableOpacity>
                      </View>
                      {!set.completed && (
                        <View style={styles.workoutSetControls}>
                          <NumberControl
                            label={exConfig.weightLabel}
                            value={set.weight}
                            step={exConfig.weightStep}
                            placeholder={exConfig.weightPlaceholder}
                            onChange={(val: any) => updateSet(currentExercise.id, setIndex, 'weight', val)}
                          />
                          <NumberControl
                            label={exConfig.repLabel}
                            value={set.reps}
                            step={exConfig.repStep}
                            placeholder={exConfig.repPlaceholder}
                            onChange={(val: any) => updateSet(currentExercise.id, setIndex, 'reps', val)}
                          />
                        </View>
                      )}
                      {set.completed && (
                        <View style={styles.workoutSetCompletedInfo}>
                          <Text style={styles.workoutSetCompletedText}>
                            {set.weight || 0} {exConfig.weightLabel === 'LBS' ? 'LBS' : ''}
                          </Text>
                          <Text style={styles.workoutSetCompletedText}>
                            {set.reps || 0} {exConfig.repLabel === 'REPS' ? 'REPS' : 'SEC'}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
                <TouchableOpacity onPress={() => addSet(currentExercise.id)} style={styles.addSetButton}>
                  <Plus size={16} color="#64748b" />
                  <Text style={styles.addSetButtonText}>ADD SET</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.workoutFocusActions}>
                {currentExIndex < visibleWorkout.length - 1 ? (
                  <NeonButton onPress={() => setCurrentExIndex(currentExIndex + 1)} style={styles.nextButton}>
                    <Text>NEXT EXERCISE</Text>
                    <ArrowRight size={18} color="#0f172a" />
                  </NeonButton>
                ) : (
                  <NeonButton onPress={finishWorkout} style={styles.completeButton}>
                    <Text>COMPLETE SESSION</Text>
                  </NeonButton>
                )}
                <TouchableOpacity onPress={abortSession} style={styles.abortButton}>
                  <Text style={styles.abortButtonText}>Abort Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
    </>
  );
};

const ChallengesView = () => {
  return (
    <ScrollView style={styles.challengesView} contentContainerStyle={styles.challengesViewContent}>
      <GlassCard style={styles.emptyCard}>
        <Text style={styles.sectionTitle}>CHALLENGES</Text>
        <Text style={styles.emptyCardText}>Nothing here yet. Coming soon.</Text>
      </GlassCard>
    </ScrollView>
  );
};

const StepsView = () => {
  return (
    <ScrollView style={styles.stepsView} contentContainerStyle={styles.stepsViewContent}>
      <GlassCard style={styles.emptyCard}>
        <Text style={styles.sectionTitle}>STEPS</Text>
        <Text style={styles.emptyCardText}>Nothing here yet. Coming soon.</Text>
      </GlassCard>
    </ScrollView>
  );
};

const HomeView = ({ data, onChangeView, streak, xp }: any) => {
  const currentRank = getRank(xp);
  return (
    <ScrollView style={styles.homeView} contentContainerStyle={styles.homeViewContent}>
      <GlassCard style={styles.homeCard}>
        <Text style={styles.homeCardTitle}>WELCOME BACK</Text>
        <Text style={styles.homeCardSubtitle}>Ready to train?</Text>
      </GlassCard>
      <TouchableOpacity onPress={() => onChangeView('gym')} style={styles.homeQuickAction}>
        <Dumbbell size={24} color="#f97316" />
        <Text style={styles.homeQuickActionText}>START WORKOUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const StatsView = ({ data }: any) => {
  const xp = calculateXP(data);
  const currentRank = getRank(xp);
  
  return (
    <ScrollView style={styles.statsView} contentContainerStyle={styles.statsViewContent}>
      <GlassCard style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>TOTAL XP</Text>
        <Text style={styles.statsCardValue}>{xp.toLocaleString()}</Text>
      </GlassCard>
      <GlassCard style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>RANK</Text>
        <Text style={[styles.statsCardValue, { color: currentRank.color }]}>{currentRank.title}</Text>
      </GlassCard>
      <GlassCard style={styles.statsCard}>
        <Text style={styles.statsCardTitle}>GYM SESSIONS</Text>
        <Text style={styles.statsCardValue}>{data.gymLogs?.length || 0}</Text>
      </GlassCard>
    </ScrollView>
  );
};

// --- App Shell ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(DEFAULT_DATA);

  // Auth State Listener
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data Sync Listener
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new users
          console.error("Data fetch error:", error);
        }

        if (data) {
          setData({ ...DEFAULT_DATA, ...data.data });
        } else {
          // Create initial user data using upsert to avoid conflicts
          const { error: insertError } = await supabase
            .from('user_data')
            .upsert(
              {
                user_id: user.id,
                data: DEFAULT_DATA,
              },
              {
                onConflict: 'user_id',
              }
            );
          if (insertError) {
            console.error("Initial data creation error:", insertError);
          }
          setData(DEFAULT_DATA);
        }
      } catch (e) {
        console.error("Data sync error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`user_data:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_data',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRecord: any = (payload as any).new;
          if (newRecord && newRecord.data) {
            setData({ ...DEFAULT_DATA, ...newRecord.data });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
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

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

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
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

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
    await supabase.auth.signOut();
    setData(DEFAULT_DATA);
  };

  const saveData = async (newData: any) => {
    if (!user) return;
    try {
      setData(newData);
      const { error } = await supabase
        .from('user_data')
        .upsert(
          {
            user_id: user.id,
            data: newData,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );
      if (error) throw error;
    } catch (e) {
      console.error("Save failed", e);
      // If upsert fails, try update instead
      try {
        const { error: updateError } = await supabase
          .from('user_data')
          .update({
            data: newData,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      } catch (updateErr) {
        console.error("Update also failed", updateErr);
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView data={data} onChangeView={setActiveTab} streak={data.gymLogs.length} xp={calculateXP(data)} />;
      case 'steps':
        return <StepsView />;
      case 'gym':
        return <GymView data={data} updateData={saveData} user={user} />;
      case 'challenges':
        return <ChallengesView />;
      case 'stats':
        return <StatsView data={data} />;
      default:
        return <HomeView data={data} onChangeView={setActiveTab} />;
    }
  };

  const NavItem = ({ id, icon: Icon, label }: any) => {
    const isActive = activeTab === id;
    return (
      <TouchableOpacity
        onPress={() => setActiveTab(id)}
        style={styles.navItem}
      >
        <Icon size={24} color={isActive ? "#22d3ee" : "#475569"} strokeWidth={isActive ? 2.5 : 2} />
        {isActive && <View style={styles.navItemIndicator} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={styles.loadingText}>INITIALIZING SYSTEM...</Text>
      </View>
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
        <View style={styles.navBar}>
          <NavItem id="home" icon={Home} label="Home" />
          <NavItem id="challenges" icon={Swords} label="Challenges" />
          <NavItem id="gym" icon={Dumbbell} label="Gym" />
          <NavItem id="stats" icon={BarChart2} label="Stats" />
          <NavItem id="steps" icon={Footprints} label="Steps" />
        </View>
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
