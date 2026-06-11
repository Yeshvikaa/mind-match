import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  badgeUrl: {
    type: String, // Can be an emoji (e.g. "⚡") or image path
    default: "🏆"
  },
  conditionType: {
    type: String,
    enum: ['games_played', 'time', 'errors', 'multiplier', 'streak', 'score'],
    required: true
  },
  conditionValue: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
