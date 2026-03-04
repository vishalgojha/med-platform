/**
 * FATIGUE DETECTION SYSTEM
 * 
 * Fatigue is a derived clinical-relevant friction signal.
 * It affects: adherence, responsiveness, escalation risk.
 * 
 * FATIGUE IS NOT:
 * - A sentiment score
 * - A mental health proxy
 * - A vague "burnout" label
 * 
 * FATIGUE NEVER TRIGGERS ADVICE.
 * It only:
 * - Biases decision state toward STABILIZE
 * - Increases visibility in doctor summary
 * - Tightens logging prompts
 */

import { subDays, differenceInDays, format } from "date-fns";

// Language markers that indicate fatigue (weighted)
const FATIGUE_MARKERS = {
  high: [
    "don't care",
    "dont care", 
    "what's the point",
    "whats the point",
    "give up",
    "giving up",
    "can't do this",
    "cant do this",
    "too hard",
    "impossible"
  ],
  medium: [
    "tired",
    "exhausted",
    "overwhelmed",
    "frustrated",
    "fed up",
    "sick of",
    "hate this",
    "whatever",
    "doesn't matter",
    "doesnt matter"
  ],
  low: [
    "busy",
    "forgot",
    "skipped",
    "missed",
    "later",
    "not now",
    "maybe tomorrow"
  ]
};

/**
 * Calculate fatigue score from patient data
 * 
 * @param {Object} params
 * @param {Array} params.logs - HealthLog entries
 * @param {Array} params.memories - ConversationMemory entries
 * @param {Array} params.adherenceRecords - MedicationAdherence entries
 * @param {number} params.days - Time window (default 7)
 * @returns {Object} { level, confidence, trend, evidence }
 */
export function calculateFatigue({ logs = [], memories = [], adherenceRecords = [], days = 7 }) {
  const startDate = subDays(new Date(), days);
  const recentLogs = logs.filter(l => new Date(l.created_date) >= startDate);
  const recentMemories = memories.filter(m => new Date(m.created_date) >= startDate);
  const recentAdherence = adherenceRecords.filter(a => new Date(a.scheduled_time) >= startDate);

  let score = 0;
  const evidence = [];

  // 1. MISSED LOGS (weight: 0-30)
  const expectedLogsPerDay = 2; // Reasonable expectation
  const expectedLogs = days * expectedLogsPerDay;
  const actualLogs = recentLogs.filter(l => l.log_type === 'sugar').length;
  const logGapRatio = 1 - (actualLogs / expectedLogs);
  
  if (logGapRatio > 0.7) {
    score += 30;
    evidence.push({ type: 'missed_logs', severity: 'high', detail: `${actualLogs}/${expectedLogs} logs` });
  } else if (logGapRatio > 0.4) {
    score += 15;
    evidence.push({ type: 'missed_logs', severity: 'medium', detail: `${actualLogs}/${expectedLogs} logs` });
  } else if (logGapRatio > 0.2) {
    score += 5;
    evidence.push({ type: 'missed_logs', severity: 'low', detail: `${actualLogs}/${expectedLogs} logs` });
  }

  // 2. LANGUAGE MARKERS (weight: 0-40)
  const allText = [
    ...recentLogs.map(l => l.notes || ''),
    ...recentMemories.map(m => m.value || '')
  ].join(' ').toLowerCase();

  let languageScore = 0;
  FATIGUE_MARKERS.high.forEach(marker => {
    if (allText.includes(marker)) {
      languageScore += 15;
      evidence.push({ type: 'language', severity: 'high', detail: marker });
    }
  });
  FATIGUE_MARKERS.medium.forEach(marker => {
    if (allText.includes(marker)) {
      languageScore += 8;
      evidence.push({ type: 'language', severity: 'medium', detail: marker });
    }
  });
  FATIGUE_MARKERS.low.forEach(marker => {
    if (allText.includes(marker)) {
      languageScore += 3;
      evidence.push({ type: 'language', severity: 'low', detail: marker });
    }
  });
  score += Math.min(languageScore, 40); // Cap at 40

  // 3. MEDICATION ADHERENCE (weight: 0-20)
  const missedMeds = recentAdherence.filter(a => a.status === 'missed' || a.status === 'skipped');
  const totalMeds = recentAdherence.length;
  
  if (totalMeds > 0) {
    const missRate = missedMeds.length / totalMeds;
    if (missRate > 0.5) {
      score += 20;
      evidence.push({ type: 'medication', severity: 'high', detail: `${Math.round(missRate * 100)}% missed` });
    } else if (missRate > 0.25) {
      score += 10;
      evidence.push({ type: 'medication', severity: 'medium', detail: `${Math.round(missRate * 100)}% missed` });
    }
  }

  // 4. HIGH READINGS WITHOUT CONTEXT (weight: 0-10)
  const highReadingsNoContext = recentLogs.filter(l => 
    l.log_type === 'sugar' && 
    l.numeric_value > 200 && 
    (!l.notes || l.notes.length < 10)
  );
  if (highReadingsNoContext.length >= 3) {
    score += 10;
    evidence.push({ type: 'disengagement', severity: 'medium', detail: `${highReadingsNoContext.length} high readings, no context` });
  }

  // Calculate level
  let level = 'none';
  if (score >= 60) level = 'severe';
  else if (score >= 35) level = 'detected';
  else if (score >= 15) level = 'mild';

  // Calculate confidence (based on data availability)
  const dataPoints = recentLogs.length + recentAdherence.length;
  let confidence = Math.min(dataPoints / 10, 1); // Need ~10 data points for full confidence
  if (dataPoints < 3) confidence = 0.3; // Low confidence with sparse data

  // Calculate trend (compare first half vs second half of window)
  const midpoint = subDays(new Date(), Math.floor(days / 2));
  const firstHalfEvidence = evidence.filter(e => {
    // Simplified: just count evidence types
    return e.severity === 'high' || e.severity === 'medium';
  }).length;
  
  // For trend, we'd ideally compare to previous period
  // Simplified: if severe/detected with high evidence, assume rising
  let trend = 'stable';
  if (level === 'severe' && evidence.length >= 4) trend = 'rising';
  else if (level === 'none' && evidence.length === 0) trend = 'stable';

  return {
    level,
    confidence: Math.round(confidence * 100) / 100,
    trend,
    score,
    evidence: evidence.slice(0, 5), // Top 5 evidence items
    computed_at: new Date().toISOString()
  };
}

/**
 * WHAT CANNOT INFLUENCE FATIGUE:
 * 
 * - Glucose values alone (high sugar ≠ fatigue)
 * - Time of day
 * - Meal choices
 * - Exercise levels
 * - Age, gender, demographics
 * - Historical HbA1c
 * - Doctor recommendations
 * 
 * Fatigue is ONLY derived from:
 * - Behavioral signals (logging gaps)
 * - Language signals (expressed disengagement)
 * - Adherence signals (medication patterns)
 * - Context signals (high readings without explanation)
 */

/**
 * Get fatigue-adjusted decision state bias
 * 
 * When fatigue is detected, bias toward STABILIZE state
 */
export function getFatigueStateBias(fatigueLevel) {
  switch (fatigueLevel) {
    case 'severe':
      return { preferredState: 'stabilize', escalateThreshold: 'lower' };
    case 'detected':
      return { preferredState: 'stabilize', escalateThreshold: 'normal' };
    case 'mild':
      return { preferredState: 'observe', escalateThreshold: 'normal' };
    default:
      return { preferredState: 'observe', escalateThreshold: 'normal' };
  }
}

/**
 * Format fatigue for doctor summary (no prose, just signal)
 */
export function formatFatigueForDoctor(fatigue) {
  return {
    status: fatigue.level,
    trend: fatigue.trend,
    confidence: fatigue.confidence,
    evidence_count: fatigue.evidence.length,
    top_signals: fatigue.evidence.slice(0, 3).map(e => e.detail)
  };
}