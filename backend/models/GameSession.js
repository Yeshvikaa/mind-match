import mongoose from 'mongoose';

const FlipEventSchema = new mongoose.Schema({
  cardIndex: { type: Number, required: true },
  cardValue: { type: String, required: true },
  timestamp: { type: Number, required: true } // Milliseconds from match start
});

const GameSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'completed'
  },
  moves: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number, // seconds
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  cardTheme: {
    type: String,
    default: 'neon-brain'
  },
  // Detailed chronological logging of each card flip
  flipLog: [FlipEventSchema],
  
  // AI Cognitive analysis saved per session
  aiAnalytics: {
    spatialAccuracy: { type: Number },     // % correct clicks when looking for an already-revealed card
    averageRecallDelay: { type: Number },   // average time (ms) to match known cards
    forgettingRate: { type: Number },       // ratio of viewings-to-match for cards seen before
    attentionFocusScore: { type: Number },   // consistency of flips (speed & backtrack errors)
    cognitiveLoadScore: { type: Number },    // measure of cognitive strain (error rate spikes in hard phases)
    insights: [{ type: String }]            // Personalized text recommendations
  },
  isMultiplayer: {
    type: Boolean,
    default: false
  },
  multiplayerOpponentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.GameSession || mongoose.model('GameSession', GameSessionSchema);
