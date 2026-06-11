import mongoose from 'mongoose';

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/mind_match';

export let isUsingMockDB = false;

// Mock database storage for out-of-the-box operation when MongoDB is not running.
export const mockDB = {
  users: [],
  gameSessions: [],
  scores: [],
  achievements: [],
  challenges: []
};

// Seed initial values for Mock DB
const seedMockDB = () => {
  console.log('🌱 Seeding Mock Database with default Achievements & Challenges...');
  
  // Default achievements
  mockDB.achievements = [
    { _id: 'ach_1', name: 'First Match', description: 'Complete your first game', badgeUrl: '🥇', conditionType: 'games_played', conditionValue: 1 },
    { _id: 'ach_2', name: 'Speed Demon', description: 'Complete a card match game in under 45 seconds', badgeUrl: '⚡', conditionType: 'time', conditionValue: 45 },
    { _id: 'ach_3', name: 'Perfect Vision', description: 'Match all cards with 0 visual backtracking errors', badgeUrl: '👁️', conditionType: 'errors', conditionValue: 0 },
    { _id: 'ach_4', name: 'Match Master', description: 'Achieve 10 total game completions', badgeUrl: '👑', conditionType: 'games_played', conditionValue: 10 }
  ];

  // Default challenges
  mockDB.challenges = [
    {
      _id: 'ch_1',
      title: 'Quick Reflexes',
      description: 'Complete an Easy game in under 20 seconds.',
      difficulty: 'easy',
      targetTime: 20,
      targetMoves: 12,
      pointsReward: 100,
      isActive: true,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      _id: 'ch_2',
      title: 'Mind over Grid',
      description: 'Complete a Medium game with fewer than 22 moves.',
      difficulty: 'medium',
      targetTime: 50,
      targetMoves: 22,
      pointsReward: 250,
      isActive: true,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      _id: 'ch_3',
      title: 'Grandmaster Recall',
      description: 'Match all cards on Hard difficulty with an AI Visual Accuracy above 85%.',
      difficulty: 'hard',
      targetTime: 120,
      targetMoves: 50,
      pointsReward: 500,
      isActive: true,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  ];
};

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000 // Quick timeout to trigger fallback
    });
    console.log('✅ MongoDB connected successfully to ' + uri);
  } catch (error) {
    console.warn('⚠️ Could not connect to MongoDB (' + error.message + ').');
    console.warn('🚀 SWITCHING TO ROBUST IN-MEMORY MOCK DATABASE FALLBACK!');
    isUsingMockDB = true;
    seedMockDB();
  }
};
