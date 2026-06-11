import User from '../models/User.js';
import GameSession from '../models/GameSession.js';
import Challenge from '../models/Challenge.js';
import { isUsingMockDB, mockDB } from '../config/db.js';

// @desc    Get dashboard metrics & cognitive aggregate analytics
// @route   GET /api/admin/overview
// @access  Private/Admin
export const getAdminOverview = async (req, res) => {
  try {
    let totalUsers = 0;
    let totalGuests = 0;
    let totalGames = 0;
    let avgAccuracy = 75;
    let avgRecall = 1200;

    if (isUsingMockDB) {
      totalUsers = mockDB.users.filter(u => !u.isGuest).length;
      totalGuests = mockDB.users.filter(u => u.isGuest).length;
      totalGames = mockDB.gameSessions.length;

      const sessionsWithAnalytics = mockDB.gameSessions.filter(s => s.aiAnalytics);
      if (sessionsWithAnalytics.length > 0) {
        const sumAccuracy = sessionsWithAnalytics.reduce((sum, s) => sum + s.aiAnalytics.spatialAccuracy, 0);
        const sumDelay = sessionsWithAnalytics.reduce((sum, s) => sum + s.aiAnalytics.averageRecallDelay, 0);
        avgAccuracy = Math.round(sumAccuracy / sessionsWithAnalytics.length);
        avgRecall = Math.round(sumDelay / sessionsWithAnalytics.length);
      }
    } else {
      totalUsers = await User.countDocuments({ isGuest: false });
      totalGuests = await User.countDocuments({ isGuest: true });
      totalGames = await GameSession.countDocuments();

      const aggregates = await GameSession.aggregate([
        {
          $group: {
            _id: null,
            avgAccuracy: { $avg: "$aiAnalytics.spatialAccuracy" },
            avgRecall: { $avg: "$aiAnalytics.averageRecallDelay" }
          }
        }
      ]);
      if (aggregates.length > 0) {
        avgAccuracy = Math.round(aggregates[0].avgAccuracy || 75);
        avgRecall = Math.round(aggregates[0].avgRecall || 1200);
      }
    }

    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalGuests,
        totalGames,
        avgAccuracy,
        avgRecall
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users and stats
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    let list = [];
    if (isUsingMockDB) {
      list = mockDB.users.map(u => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        isGuest: u.isGuest,
        role: u.role,
        gamesPlayed: u.stats.gamesPlayed,
        points: u.stats.points,
        createdAt: u.createdAt
      }));
    } else {
      list = await User.find({}).select('username email isGuest role stats createdAt');
    }

    res.json({
      success: true,
      users: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Publish a new custom challenge
// @route   POST /api/admin/challenges
// @access  Private/Admin
export const publishChallenge = async (req, res) => {
  const { title, description, difficulty, targetTime, targetMoves, pointsReward } = req.body;

  if (!title || !description || !difficulty || !targetTime || !targetMoves) {
    return res.status(400).json({ success: false, message: 'Please enter all challenge parameters' });
  }

  try {
    const expiryDate = new Date();
    expiryDate.setHours(23, 59, 59, 999); // Set to expire at midnight tonight

    let newChallenge;

    if (isUsingMockDB) {
      newChallenge = {
        _id: 'mock_ch_' + Math.random().toString(36).substr(2, 9),
        title,
        description,
        difficulty,
        targetTime: parseInt(targetTime),
        targetMoves: parseInt(targetMoves),
        pointsReward: parseInt(pointsReward) || 100,
        isActive: true,
        expiryDate,
        createdAt: new Date()
      };
      mockDB.challenges.push(newChallenge);
    } else {
      newChallenge = await Challenge.create({
        title,
        description,
        difficulty,
        targetTime,
        targetMoves,
        pointsReward,
        expiryDate
      });
    }

    res.status(201).json({
      success: true,
      message: 'Challenge published successfully!',
      challenge: newChallenge
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    if (isUsingMockDB) {
      const idx = mockDB.users.findIndex(u => u._id === id);
      if (idx !== -1) {
        mockDB.users.splice(idx, 1);
        return res.json({ success: true, message: 'User deleted successfully from mock store' });
      }
      return res.status(404).json({ success: false, message: 'User not found in mock store' });
    }

    // Standard Mongoose Flow
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'User account purged successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
