import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import { isUsingMockDB, mockDB } from '../config/db.js';

// @desc    Get active daily challenges
// @route   GET /api/challenges
// @access  Private
export const getActiveChallenges = async (req, res) => {
  try {
    let activeList = [];
    if (isUsingMockDB) {
      activeList = mockDB.challenges.filter(c => c.isActive && new Date(c.expiryDate) > new Date());
    } else {
      activeList = await Challenge.find({
        isActive: true,
        expiryDate: { $gt: new Date() }
      });
    }

    res.json({
      success: true,
      challenges: activeList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate and submit a challenge completion
// @route   POST /api/challenges/:id/complete
// @access  Private
export const submitChallengeCompletion = async (req, res) => {
  const { id } = req.params;
  const { timeSpent, moves } = req.body;

  if (timeSpent === undefined || moves === undefined) {
    return res.status(400).json({ success: false, message: 'Please specify time spent and moves' });
  }

  try {
    let challenge = null;

    if (isUsingMockDB) {
      challenge = mockDB.challenges.find(c => c._id === id);
    } else {
      challenge = await Challenge.findById(id);
    }

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Daily challenge not found or expired' });
    }

    // Evaluate success condition
    const timeSuccess = timeSpent <= challenge.targetTime;
    const movesSuccess = moves <= challenge.targetMoves;
    const isCompleted = timeSuccess && movesSuccess;

    if (!isCompleted) {
      return res.json({
        success: false,
        message: `Challenge requirements not met! Target Time: <= ${challenge.targetTime}s (You: ${timeSpent}s), Target Moves: <= ${challenge.targetMoves} (You: ${moves})`,
        requirements: {
          targetTime: challenge.targetTime,
          targetMoves: challenge.targetMoves,
          playerTime: timeSpent,
          playerMoves: moves
        }
      });
    }

    // Award bonus points and advance daily streak
    let updatedPoints = 0;
    let newStreak = 1;

    if (isUsingMockDB) {
      const userIndex = mockDB.users.findIndex(u => u._id === req.user._id);
      if (userIndex !== -1) {
        const user = mockDB.users[userIndex];
        user.stats.points += challenge.pointsReward;
        
        // Streak calculation
        const now = new Date();
        if (user.dailyStreak.lastActive) {
          const diffTime = Math.abs(now - new Date(user.dailyStreak.lastActive));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            user.dailyStreak.count += 1;
          } else if (diffDays > 1) {
            user.dailyStreak.count = 1;
          }
        } else {
          user.dailyStreak.count = 1;
        }
        user.dailyStreak.lastActive = now;
        
        updatedPoints = user.stats.points;
        newStreak = user.dailyStreak.count;
        mockDB.users[userIndex] = user;
      }
    } else {
      const user = await User.findById(req.user._id);
      if (user) {
        user.stats.points += challenge.pointsReward;
        
        const now = new Date();
        if (user.dailyStreak.lastActive) {
          const diffTime = Math.abs(now - new Date(user.dailyStreak.lastActive));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            user.dailyStreak.count += 1;
          } else if (diffDays > 1) {
            user.dailyStreak.count = 1;
          }
        } else {
          user.dailyStreak.count = 1;
        }
        user.dailyStreak.lastActive = now;
        
        await user.save();
        updatedPoints = user.stats.points;
        newStreak = user.dailyStreak.count;
      }
    }

    res.json({
      success: true,
      message: `🎉 Challenge completed! Awarded +${challenge.pointsReward} bonus points!`,
      reward: challenge.pointsReward,
      currentPoints: updatedPoints,
      streak: newStreak
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
