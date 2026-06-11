/**
 * Mind Match AI Heuristic Engine
 * Computes deep cognitive performance metrics from raw gameplay card-flip trails.
 */

export const analyzeGameplayLog = (flipLog, difficulty) => {
  if (!flipLog || flipLog.length < 4) {
    return {
      spatialAccuracy: 75,
      averageRecallDelay: 1500,
      forgettingRate: 1.2,
      attentionFocusScore: 80,
      cognitiveLoadScore: 40,
      insights: ["Play a few more games to generate deeper AI memory diagnostics!"]
    };
  }

  let totalTurns = 0;
  let spatialHits = 0;
  let spatialOpportunities = 0;
  let visualBacktracks = 0;
  
  const revealedPositions = {}; // cardIndex -> { value, lastSeenTimestamp }
  const matchCounts = {}; // cardValue -> viewCount
  const matchDelays = []; // time differences to successfully complete a known match

  // Process pairs of flips
  for (let i = 0; i < flipLog.length - 1; i += 2) {
    totalTurns++;
    const f1 = flipLog[i];
    const f2 = flipLog[i + 1];

    if (!f1 || !f2) break;

    // Track views
    revealedPositions[f1.cardIndex] = { value: f1.cardValue, timestamp: f1.timestamp };
    matchCounts[f1.cardValue] = (matchCounts[f1.cardValue] || 0) + 1;

    // Evaluate turn decision
    // Does the match for f1 already exist in revealedPositions?
    let knownMatchIndex = -1;
    for (const [idx, data] of Object.entries(revealedPositions)) {
      const numericIdx = parseInt(idx);
      if (numericIdx !== f1.cardIndex && data.value === f1.cardValue) {
        knownMatchIndex = numericIdx;
        break;
      }
    }

    if (knownMatchIndex !== -1) {
      // The player *knew* (or had seen) the matching card before!
      spatialOpportunities++;
      if (f2.cardIndex === knownMatchIndex) {
        // Player successfully recalled and clicked the matching card!
        spatialHits++;
        const delay = f2.timestamp - f1.timestamp;
        matchDelays.push(delay);
      } else {
        // Player failed to recall, and flipped some other card
        // Check if the other card was already seen (visual backtracking error)
        if (revealedPositions[f2.cardIndex]) {
          visualBacktracks++;
        }
      }
    }

    // Now record f2
    revealedPositions[f2.cardIndex] = { value: f2.cardValue, timestamp: f2.timestamp };
    matchCounts[f2.cardValue] = (matchCounts[f2.cardValue] || 0) + 1;
  }

  // AI Metric Calculations
  
  // 1. Spatial Accuracy (%)
  const spatialAccuracy = spatialOpportunities > 0
    ? Math.round((spatialHits / spatialOpportunities) * 100)
    : 100; // Perfect if they never missed an opportunity

  // 2. Average Recall Delay
  const averageRecallDelay = matchDelays.length > 0
    ? Math.round(matchDelays.reduce((sum, val) => sum + val, 0) / matchDelays.length)
    : 1200; // Default to 1.2s if no direct recalls occurred

  // 3. Forgetting Rate (average number of times cards are viewed before matching)
  const viewCounts = Object.values(matchCounts);
  const forgettingRate = viewCounts.length > 0
    ? parseFloat((viewCounts.reduce((sum, v) => sum + v, 0) / (viewCounts.length * 2)).toFixed(2))
    : 1.0;

  // 4. Attention Focus Score (measures speed consistency & avoidance of backtracks)
  let backtrackPenalty = visualBacktracks * 5;
  let focus = 100 - backtrackPenalty;
  
  // Add a timing variance penalty if user is playing spasmodically
  let timeDiffs = [];
  for (let i = 0; i < flipLog.length - 1; i++) {
    timeDiffs.push(flipLog[i+1].timestamp - flipLog[i].timestamp);
  }
  if (timeDiffs.length > 0) {
    const mean = timeDiffs.reduce((a,b)=>a+b, 0) / timeDiffs.length;
    const variance = timeDiffs.reduce((a,b)=>a+Math.pow(b-mean, 2), 0) / timeDiffs.length;
    const stdDev = Math.sqrt(variance);
    // standardise stdDev penalty
    focus -= Math.min(15, Math.round(stdDev / 300));
  }
  const attentionFocusScore = Math.max(35, Math.min(100, Math.round(focus)));

  // 5. Cognitive Load Score (Difficulty scale, mistakes relative to moves)
  const gridFactor = difficulty === 'hard' ? 8 : (difficulty === 'medium' ? 6 : 4);
  const baseLoad = (visualBacktracks / totalTurns) * 100;
  const cognitiveLoadScore = Math.max(15, Math.min(100, Math.round(baseLoad + (gridFactor * 4))));

  // 6. Dynamic Insights (Heuristic Rules)
  const insights = [];

  if (forgettingRate > 1.4) {
    insights.push("Memory Decay Alert: You are viewing the same cards multiple times. Try dividing the board mentally into quadrants (e.g., upper left) to anchor your visual mapping.");
  } else {
    insights.push("Retention Star: You are matching cards within very few exposures, showing strong short-term memory anchoring.");
  }

  if (spatialAccuracy < 70) {
    insights.push("Spatial Precision Note: We noticed visual backtracking errors. When you flip a card and don't match it, close your eyes for a split second to lock its grid location.");
  } else {
    insights.push("High Visual Recall: Your spatial recall is excellent. You successfully capture matches when the card has been previously revealed.");
  }

  if (attentionFocusScore < 70) {
    insights.push("Concentration Drift: The variation in your turn speed suggests moments of distraction. Setting a steady, rhythmic pace improves recall efficiency.");
  } else {
    insights.push("Flow State Achieved: Your rhythmic speed and consistent execution indicate high engagement and focused attention.");
  }

  if (difficulty === 'easy' && spatialAccuracy > 85) {
    insights.push("Pacing Recommendation: Easy mode is no longer challenging your working memory! Upgrade to Medium (6x6) to stimulate new neuroplastic growth.");
  } else if (difficulty === 'medium' && spatialAccuracy > 90) {
    insights.push("Cognitive Challenge: Outstanding! Your score suggests you are ready for Hard (8x8). This will significantly test your spatial chunking skills.");
  } else if (difficulty === 'hard' && cognitiveLoadScore < 50) {
    insights.push("Mastery Status: You have mastered the largest layout! Challenge friends in real-time Multiplayer to test your speed under pressure.");
  } else {
    insights.push("Consistency Booster: Repeat play is the fastest way to build neural connections. Keep practicing at this difficulty to bring down your average completion time.");
  }

  return {
    spatialAccuracy,
    averageRecallDelay,
    forgettingRate,
    attentionFocusScore,
    cognitiveLoadScore,
    insights
  };
};
