export const ASSETS = {
  neonDumbbell: "https://storage.googleapis.com/s.mkswft.com/RmlsZTo0ZmE5ODk2ZS02N2VjLTQyMzUtYTg0MS0yN2U1OTU0OTAzNjg=/neon_dumbbell.png",
  cyberHeart: "https://storage.googleapis.com/s.mkswft.com/RmlsZTpjN2Y4ODkzNy05N2VjLTQyMzUtYTg0MS0yN2U1OTU0OTAzNjg=/cyber_heart.png",
  background: "https://storage.googleapis.com/s.mkswft.com/RmlsZTpmZTA1YjU3ZS0zODQ5LTQ2ODktOTI4MS02ZjM4NTVhZmFiZWY=/hyperfit_bg.png"
};

export const CHALLENGE_LIBRARY = [
  { id: 'pushup_30', title: 'PUSH PROTOCOL', description: 'Upper body strength progression.', icon: '⚡', color: 'orange', totalDays: 30, type: 'reps', mode: 'progressive', baseReps: 10, increment: 2, restFreq: 4 },
  { id: 'squat_30', title: 'IRON LEGS', description: 'High volume lower body hypertrophy.', icon: '🦵', color: 'emerald', totalDays: 30, type: 'reps', mode: 'progressive', baseReps: 20, increment: 5, restFreq: 5 },
  { id: 'plank_14', title: 'CORE STABILITY', description: 'System stability update.', icon: '🛡️', color: 'indigo', totalDays: 14, type: 'time', mode: 'progressive', baseReps: 30, increment: 10, restFreq: 3 }
];

export const WORKOUT_TEMPLATES = [
  { id: 'push_day', name: 'Push Day', icon: '🔥', description: 'Chest, Shoulders & Triceps.', exercises: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Lateral Raises', 'Tricep Dips'] },
  { id: 'pull_day', name: 'Pull Day', icon: '🦍', description: 'Back & Biceps.', exercises: ['Deadlift', 'Pull Ups', 'Barbell Rows', 'Face Pulls', 'Bicep Curls'] },
  { id: 'leg_day', name: 'Leg Day', icon: '🦕', description: 'Quads, Hamstrings & Glutes.', exercises: ['Squats', 'Leg Press', 'Romanian Deadlift', 'Leg Extensions', 'Calf Raises'] },
  { id: 'abs_core', name: 'Core', icon: '🧱', description: 'Stability and strength.', exercises: ['Plank', 'Russian Twists', 'Leg Raises', 'Cable Crunches'] }
];

export const DEFAULT_EXERCISES = [
  'Squats', 'Bench Press', 'Deadlift', 'Overhead Press', 'Pull Ups', 'Dumbbell Rows', 'Lunges', 'Plank', 'Bicep Curls', 'Tricep Dips', 'Leg Press', 'Lat Pulldowns', 'Pushups', 'Shoulder Press', 'Glute Bridges', 'Russian Twists', 'Mountain Climbers', 'Burpees', 'Leg Extensions', 'Hamstring Curls'
];

export const DEFAULT_DATA = {
  stepsToday: 2500,
  gymLogs: [],
  workouts: {},
  workoutStatus: {},
  activeChallenges: [],
  customTemplates: [],
  customChallenges: [],
  pushupsCompleted: []
};

