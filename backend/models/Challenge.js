import mongoose from 'mongoose';

const ChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  targetTime: {
    type: Number, // Seconds threshold to beat
    required: true
  },
  targetMoves: {
    type: Number, // Moves threshold to be under
    required: true
  },
  pointsReward: {
    type: Number,
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Challenge || mongoose.model('Challenge', ChallengeSchema);
