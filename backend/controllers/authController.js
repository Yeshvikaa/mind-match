import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { isUsingMockDB, mockDB } from '../config/db.js';

// Helper to generate custom user JSON
const sanitizeUser = (user) => {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    isGuest: user.isGuest,
    avatarSeed: user.avatarSeed,
    theme: user.theme,
    cardTheme: user.cardTheme,
    soundEnabled: user.soundEnabled,
    role: user.role,
    stats: user.stats,
    achievementsUnlocked: user.achievementsUnlocked,
    dailyStreak: user.dailyStreak,
    createdAt: user.createdAt
  };
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all details' });
  }

  try {
    if (isUsingMockDB) {
      // Check if username/email already exists
      const exists = mockDB.users.find(u => u.username === username || u.email === email);
      if (exists) {
        return res.status(400).json({ success: false, message: 'Username or email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        _id: 'mock_usr_' + Math.random().toString(36).substr(2, 9),
        username,
        email,
        password: hashedPassword,
        isGuest: false,
        avatarSeed: 'avatar-' + Math.floor(Math.random() * 8 + 1),
        theme: 'dark',
        cardTheme: 'neon-brain',
        soundEnabled: true,
        role: 'user',
        stats: { gamesPlayed: 0, gamesWon: 0, totalMoves: 0, totalTime: 0, avgCompletionTime: 0, bestTimeEasy: 9999, bestTimeMedium: 9999, bestTimeHard: 9999, bestScore: 0, points: 0 },
        achievementsUnlocked: [],
        dailyStreak: { count: 1, lastActive: new Date() },
        createdAt: new Date()
      };

      mockDB.users.push(newUser);
      
      return res.status(201).json({
        success: true,
        token: generateToken(newUser._id),
        user: sanitizeUser(newUser)
      });
    }

    // Standard MongoDB Mongoose Flow
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatarSeed: 'avatar-' + Math.floor(Math.random() * 8 + 1)
    });

    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: sanitizeUser(user)
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter email and password' });
  }

  try {
    if (isUsingMockDB) {
      const user = mockDB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          success: true,
          token: generateToken(user._id),
          user: sanitizeUser(user)
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Standard Mongoose Flow
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        token: generateToken(user._id),
        user: sanitizeUser(user)
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Guest access setup (instant login without setup)
// @route   POST /api/auth/guest
// @access  Public
export const guestLogin = async (req, res) => {
  const randNum = Math.floor(Math.random() * 9000) + 1000;
  const username = `Guest_Match_${randNum}`;

  try {
    if (isUsingMockDB) {
      const guestUser = {
        _id: 'mock_guest_' + Math.random().toString(36).substr(2, 9),
        username,
        isGuest: true,
        avatarSeed: 'avatar-' + Math.floor(Math.random() * 8 + 1),
        theme: 'dark',
        cardTheme: 'neon-brain',
        soundEnabled: true,
        role: 'user',
        stats: { gamesPlayed: 0, gamesWon: 0, totalMoves: 0, totalTime: 0, avgCompletionTime: 0, bestTimeEasy: 9999, bestTimeMedium: 9999, bestTimeHard: 9999, bestScore: 0, points: 0 },
        achievementsUnlocked: [],
        dailyStreak: { count: 0, lastActive: null },
        createdAt: new Date()
      };

      mockDB.users.push(guestUser);

      return res.status(201).json({
        success: true,
        token: generateToken(guestUser._id),
        user: sanitizeUser(guestUser)
      });
    }

    // Standard MongoDB Mongoose Flow
    const user = await User.create({
      username,
      isGuest: true,
      avatarSeed: 'avatar-' + Math.floor(Math.random() * 8 + 1)
    });

    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: sanitizeUser(user)
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user)
  });
};

// @desc    Update user customizations & settings
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const { theme, cardTheme, soundEnabled, avatarSeed } = req.body;

  try {
    if (isUsingMockDB) {
      const userIndex = mockDB.users.findIndex(u => u._id === req.user._id);
      if (userIndex !== -1) {
        if (theme) mockDB.users[userIndex].theme = theme;
        if (cardTheme) mockDB.users[userIndex].cardTheme = cardTheme;
        if (soundEnabled !== undefined) mockDB.users[userIndex].soundEnabled = soundEnabled;
        if (avatarSeed) mockDB.users[userIndex].avatarSeed = avatarSeed;
        
        return res.json({
          success: true,
          user: sanitizeUser(mockDB.users[userIndex])
        });
      }
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    // Standard Mongoose Flow
    const user = await User.findById(req.user._id);
    if (user) {
      if (theme) user.theme = theme;
      if (cardTheme) user.cardTheme = cardTheme;
      if (soundEnabled !== undefined) user.soundEnabled = soundEnabled;
      if (avatarSeed) user.avatarSeed = avatarSeed;

      const updatedUser = await user.save();
      res.json({
        success: true,
        user: sanitizeUser(updatedUser)
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
