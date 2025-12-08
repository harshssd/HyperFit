import { Dimensions, Platform, StyleSheet } from 'react-native';

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

export default styles;
