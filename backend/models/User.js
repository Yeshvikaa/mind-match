import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: function() { return !this.isGuest; },
    unique: function() { return !this.isGuest && this.email; },
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() { return !this.isGuest; }
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  avatarSeed: {
    type: String,
    default: 'avatar-1'
  },
  theme: {
    type: String,
    enum: ['dark', 'light'],
    default: 'dark'
  },
  cardTheme: {
    type: String,
    enum: ['neon-brain', 'space-nebula', 'magic-runes', 'retro-pixel'],
    default: 'neon-brain'
  },
  soundEnabled: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalMoves: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 }, // seconds
    avgCompletionTime: { type: Number, default: 0 },
    bestTimeEasy: { type: Number, default: 9999 },
    bestTimeMedium: { type: Number, default: 9999 },
    bestTimeHard: { type: Number, default: 9999 },
    bestScore: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
  },
  achievementsUnlocked: [{
    achievementId: { type: String },
    unlockedAt: { type: Date, default: Date.now }
  }],
  dailyStreak: {
    count: { type: Number, default: 0 },
    lastActive: { type: Date }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
