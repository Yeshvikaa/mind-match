import GameSession from '../models/GameSession.js';
import User from '../models/User.js';
import Score from '../models/Score.js';
import Achievement from '../models/Achievement.js';
import { analyzeGameplayLog } from '../services/aiEngine.js';
import { isUsingMockDB, mockDB } from '../config/db.js';

// Predefined achievements array
const achievementsList = [
  { id: 'ach_1', name: 'First Match', description: 'Complete your first memory card game.', badgeUrl: '🥇' },
  { id: 'ach_2', name: 'Speed Demon', description: 'Complete a card match game in under 45 seconds.', badgeUrl: '⚡' },
  { id: 'ach_3', name: 'Perfect Vision', description: 'Match all cards with 0 visual backtracking errors.', badgeUrl: '👁️' },
  { id: 'ach_4', name: 'Match Master', description: 'Achieve 10 total game completions.', badgeUrl: '👑' }
];

// Helper to evaluate and unlock achievements
const runAchievementsEvaluator = (user, session, aiStats) => {
  const newUnlocks = [];
  const currentUnlockedIds = user.achievementsUnlocked.map(a => a.achievementId);

  // 1. First Match
  if (!currentUnlockedIds.includes('ach_1') && user.stats.gamesPlayed >= 1) {
    newUnlocks.push({ achievementId: 'ach_1', unlockedAt: new Date() });
  }

  // 2. Speed Demon
  if (!currentUnlockedIds.includes('ach_2') && session.timeSpent < 45) {
    newUnlocks.push({ achievementId: 'ach_2', unlockedAt: new Date() });
  }

  // 3. Perfect Vision
  if (!currentUnlockedIds.includes('ach_3') && aiStats.spatialAccuracy === 100 && session.difficulty !== 'easy') {
    newUnlocks.push({ achievementId: 'ach_3', unlockedAt: new Date() });
  }

  // 4. Match Master
  if (!currentUnlockedIds.includes('ach_4') && user.stats.gamesPlayed >= 10) {
    newUnlocks.push({ achievementId: 'ach_4', unlockedAt: new Date() });
  }

  return newUnlocks;
};

// @desc    Save a completed game session & evaluate performance
// @route   POST /api/game/session
// @access  Private
export const saveGameSession = async (req, res) => {
  const { difficulty, moves, timeSpent, score, flipLog, isMultiplayer, opponentId } = req.body;

  if (difficulty === undefined || moves === undefined || timeSpent === undefined || score === undefined) {
    return res.status(400).json({ success: false, message: 'Missing game session parameters' });
  }

  try {
    // 1. Run AI cognitive heuristics
    const aiStats = analyzeGameplayLog(flipLog, difficulty);

    let updatedUser;
    let savedSessionId;

    if (isUsingMockDB) {
      const userIndex = mockDB.users.findIndex(u => u._id === req.user._id);
      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found in mock store' });
      }

      const user = mockDB.users[userIndex];

      // Update basic cumulative stats
      user.stats.gamesPlayed += 1;
      user.stats.gamesWon += 1;
      user.stats.totalMoves += moves;
      user.stats.totalTime += timeSpent;
      user.stats.avgCompletionTime = Math.round(user.stats.totalTime / user.stats.gamesPlayed);
      
      if (score > user.stats.bestScore) user.stats.bestScore = score;

      // Update difficulty speed records
      if (difficulty === 'easy' && timeSpent < user.stats.bestTimeEasy) user.stats.bestTimeEasy = timeSpent;
      if (difficulty === 'medium' && timeSpent < user.stats.bestTimeMedium) user.stats.bestTimeMedium = timeSpent;
      if (difficulty === 'hard' && timeSpent < user.stats.bestTimeHard) user.stats.bestTimeHard = timeSpent;

      // Add points
      user.stats.points += score + (difficulty === 'hard' ? 200 : (difficulty === 'medium' ? 100 : 50));

      // Run Achievements Check
      const newlyUnlocked = runAchievementsEvaluator(user, { difficulty, timeSpent }, aiStats);
      if (newlyUnlocked.length > 0) {
        user.achievementsUnlocked = [...user.achievementsUnlocked, ...newlyUnlocked];
        user.stats.points += newlyUnlocked.length * 200; // 200 bonus pts per achievement
      }

      mockDB.users[userIndex] = user;
      updatedUser = user;

      // Save session
      savedSessionId = 'mock_ses_' + Math.random().toString(36).substr(2, 9);
      const sessionObj = {
        _id: savedSessionId,
        userId: user._id,
        difficulty,
        moves,
        timeSpent,
        score,
        flipLog,
        aiAnalytics: aiStats,
        isMultiplayer: isMultiplayer || false,
        multiplayerOpponentId: opponentId || null,
        createdAt: new Date()
      };
      mockDB.gameSessions.push(sessionObj);

      // Save scoreboard entry
      mockDB.scores.push({
        _id: 'mock_sc_' + Math.random().toString(36).substr(2, 9),
        userId: user._id,
        username: user.username,
        score,
        difficulty,
        timeSpent,
        moves,
        createdAt: new Date()
      });

      return res.status(201).json({
        success: true,
        session: sessionObj,
        newAchievements: newlyUnlocked.map(un => achievementsList.find(a => a.id === un.achievementId)),
        userStats: user.stats
      });
    }

    // Standard MongoDB Mongoose Flow
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    user.stats.gamesPlayed += 1;
    user.stats.gamesWon += 1;
    user.stats.totalMoves += moves;
    user.stats.totalTime += timeSpent;
    user.stats.avgCompletionTime = Math.round(user.stats.totalTime / user.stats.gamesPlayed);
    
    if (score > user.stats.bestScore) user.stats.bestScore = score;

    if (difficulty === 'easy' && timeSpent < user.stats.bestTimeEasy) user.stats.bestTimeEasy = timeSpent;
    if (difficulty === 'medium' && timeSpent < user.stats.bestTimeMedium) user.stats.bestTimeMedium = timeSpent;
    if (difficulty === 'hard' && timeSpent < user.stats.bestTimeHard) user.stats.bestTimeHard = timeSpent;

    user.stats.points += score + (difficulty === 'hard' ? 200 : (difficulty === 'medium' ? 100 : 50));

    const newlyUnlocked = runAchievementsEvaluator(user, { difficulty, timeSpent }, aiStats);
    if (newlyUnlocked.length > 0) {
      user.achievementsUnlocked.push(...newlyUnlocked);
      user.stats.points += newlyUnlocked.length * 200;
    }

    await user.save();

    // Create session
    const session = await GameSession.create({
      userId: req.user._id,
      difficulty,
      moves,
      timeSpent,
      score,
      flipLog,
      aiAnalytics: aiStats,
      isMultiplayer: isMultiplayer || false,
      multiplayerOpponentId: opponentId || null
    });

    // Create Score record
    await Score.create({
      userId: req.user._id,
      username: req.user.username,
      score,
      difficulty,
      timeSpent,
      moves
    });

    res.status(201).json({
      success: true,
      session,
      newAchievements: newlyUnlocked.map(un => achievementsList.find(a => a.id === un.achievementId)),
      userStats: user.stats
    });
  } catch (error) {
    console.error('Error saving game session:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get cognitive report history & dashboard data
// @route   GET /api/game/stats
// @access  Private
export const getStats = async (req, res) => {
  try {
    let sessions = [];
    if (isUsingMockDB) {
      sessions = mockDB.gameSessions
        .filter(s => s.userId === req.user._id)
        .sort((a, b) => b.createdAt - a.createdAt);
    } else {
      sessions = await GameSession.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10);
    }

    // Compile dynamic AI history metrics
    const cognitiveTrend = sessions.map(s => ({
      date: s.createdAt,
      difficulty: s.difficulty,
      score: s.score,
      moves: s.moves,
      time: s.timeSpent,
      spatialAccuracy: s.aiAnalytics?.spatialAccuracy || 75,
      attentionScore: s.aiAnalytics?.attentionFocusScore || 80
    }));

    // Compile unlocked list with badges
    const unlockedAchievements = req.user.achievementsUnlocked.map(un => {
      const match = achievementsList.find(a => a.id === un.achievementId);
      return {
        ...match,
        unlockedAt: un.unlockedAt
      };
    });

    res.json({
      success: true,
      summaryStats: req.user.stats,
      unlockedAchievements,
      allAchievements: achievementsList,
      cognitiveTrend,
      streak: req.user.dailyStreak
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unified leaderboards filtered by difficulty
// @route   GET /api/game/leaderboard
// @access  Public
export const getLeaderboard = async (req, res) => {
  const { difficulty } = req.query; // 'easy', 'medium', 'hard' (defaults to 'medium')
  const diffFilter = difficulty || 'medium';

  try {
    let list = [];
    if (isUsingMockDB) {
      list = mockDB.scores
        .filter(s => s.difficulty === diffFilter)
        .sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent)
        .slice(0, 10);
    } else {
      list = await Score.find({ difficulty: diffFilter })
        .sort({ score: -1, timeSpent: 1 })
        .limit(10);
    }

    res.json({
      success: true,
      difficulty: diffFilter,
      leaderboard: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
