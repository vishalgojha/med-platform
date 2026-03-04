/**
 * PATIENT → DOCTOR FLOW SPECIFICATION
 * 
 * This is the spine of the product. Everything else is noise.
 * 
 * ═══════════════════════════════════════════════════════════════
 * PHASE 1: PATIENT (Continuous)
 * ═══════════════════════════════════════════════════════════════
 * 
 * The patient never "manages diabetes" here.
 * They generate signal.
 * 
 * - Conversational logging
 * - Zero advice
 * - Explicit decision state (OBSERVE / STABILIZE / ESCALATE)
 * - Fatigue detection
 * - Time-windowed data capture
 * 
 * AI ROLE: Scribe with empathy, not coach
 * 
 * ═══════════════════════════════════════════════════════════════
 * PHASE 2: COMPRESSION (Automatic)
 * ═══════════════════════════════════════════════════════════════
 * 
 * System periodically generates DoctorSummary:
 * 
 * {
 *   time_window,
 *   decision_state_distribution,
 *   fatigue: { level, trend, confidence },
 *   volatility,
 *   adherence_risk,
 *   evidence_counts,
 *   patient_voice (verbatim)
 * }
 * 
 * No prose. No recommendations. No ML opinions.
 * 
 * AI ROLE: Silent. Compression only.
 * 
 * ═══════════════════════════════════════════════════════════════
 * PHASE 3: DOCTOR (Episodic)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Doctor sees:
 * - Pattern, not history
 * - Risk, not raw data
 * - Trend, not explanation
 * 
 * Doctor does what only doctors can do:
 * - Diagnose
 * - Adjust treatment
 * - Intervene
 * 
 * The app never competes here.
 * 
 * AI ROLE: None. Display only.
 * 
 * ═══════════════════════════════════════════════════════════════
 * PHASE 4: FEEDBACK LOOP (Optional, Later)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Doctor actions logged as events, not instructions:
 * - medication_changed
 * - monitoring_frequency_adjusted
 * - escalation_advised
 * 
 * This enriches future summaries without changing patient UX.
 * 
 * AI ROLE: None. Event capture only.
 * 
 * ═══════════════════════════════════════════════════════════════
 */

import { calculateFatigue, formatFatigueForDoctor } from "../fatigue/FatigueDetector";

/**
 * PHASE 1: Patient Signal Generation
 * 
 * Every patient interaction produces a SignalEvent
 */
export function createPatientSignal(log, memories = []) {
  // Determine decision state from log context
  let decisionState = 'observe';
  const notes = (log.notes || '').toLowerCase();
  
  if (notes.includes('escalate') || notes.includes('urgent') || notes.includes('emergency') ||
      (log.numeric_value && (log.numeric_value > 350 || log.numeric_value < 70))) {
    decisionState = 'escalate';
  } else if (notes.includes('tired') || notes.includes('fatigue') || notes.includes("don't care") ||
             notes.includes('overwhelmed') || notes.includes('stabilize')) {
    decisionState = 'stabilize';
  }

  return {
    timestamp: log.created_date,
    log_type: log.log_type,
    decision_state: decisionState,
    has_context: !!(log.notes && log.notes.length > 10),
    numeric_value: log.numeric_value,
    patient_voice: log.notes?.slice(0, 100) || null
  };
}

/**
 * PHASE 2: Compression
 * 
 * Compress patient signals into doctor-readable summary
 * 
 * INPUT: Raw logs, memories, adherence records
 * OUTPUT: DoctorSummary object (no prose)
 */
export function compressForDoctor({ logs, memories, adherenceRecords, patientEmail, patientName, timeWindow = 'last_7_days' }) {
  const signals = logs.map(l => createPatientSignal(l, memories));
  
  // Decision state distribution
  const stateCount = { observe: 0, stabilize: 0, escalate: 0 };
  signals.forEach(s => {
    stateCount[s.decision_state]++;
  });

  // Fatigue calculation
  const fatigue = calculateFatigue({ logs, memories, adherenceRecords });

  // Glucose volatility
  const sugarLogs = logs.filter(l => l.log_type === 'sugar' && l.numeric_value);
  let volatility = 'low';
  if (sugarLogs.length >= 2) {
    const values = sugarLogs.map(l => l.numeric_value);
    const range = Math.max(...values) - Math.min(...values);
    volatility = range > 150 ? 'critical' : range > 100 ? 'high' : range > 50 ? 'moderate' : 'low';
  }

  // Adherence risk
  const missedMeds = adherenceRecords.filter(a => a.status === 'missed' || a.status === 'skipped');
  const adherenceRisk = missedMeds.length > adherenceRecords.length * 0.3 ? 'high' : 
                        missedMeds.length > adherenceRecords.length * 0.1 ? 'medium' : 'low';

  // Patient voice (most expressive quote)
  const expressiveLogs = logs.filter(l => l.notes && l.notes.length > 20);
  const patientVoice = expressiveLogs.length > 0 ? {
    verbatim: expressiveLogs[0].notes.slice(0, 150),
    timestamp: expressiveLogs[0].created_date
  } : null;

  // Risk flags
  const riskFlags = [];
  if (adherenceRisk !== 'low') riskFlags.push('adherence_risk');
  if (fatigue.level === 'detected' || fatigue.level === 'severe') riskFlags.push('burnout_risk');
  if (sugarLogs.some(l => l.numeric_value < 70)) riskFlags.push('hypo_risk');
  if (sugarLogs.some(l => l.numeric_value > 300)) riskFlags.push('hyper_risk');
  if (stateCount.escalate > 0) riskFlags.push('escalation_triggered');

  // System recommendation (workflow routing, not medical)
  let action = 'ignore';
  let urgency = 'low';
  
  if (stateCount.escalate > 0 || riskFlags.includes('hypo_risk')) {
    action = 'contact';
    urgency = 'high';
  } else if (fatigue.level === 'severe' || riskFlags.length >= 2) {
    action = 'review';
    urgency = 'medium';
  } else if (fatigue.level === 'detected' || adherenceRisk === 'medium') {
    action = 'monitor';
    urgency = 'low';
  }

  return {
    patient_email: patientEmail,
    patient_name: patientName,
    time_window: timeWindow,
    decision_state_distribution: stateCount,
    diabetes_fatigue: formatFatigueForDoctor(fatigue),
    glucose_volatility: volatility,
    adherence_risk: adherenceRisk,
    risk_flags: riskFlags,
    patient_voice: patientVoice,
    system_recommendation: { action, urgency },
    signal_count: signals.length,
    generated_at: new Date().toISOString()
  };
}

/**
 * PHASE 3: Doctor View
 * 
 * Doctor consumes compressed summary.
 * No AI involvement. Display only.
 * 
 * Key question for validation:
 * "Could a doctor glance at this for 30 seconds and know what to do next?"
 */

/**
 * PHASE 4: Feedback Loop Events
 * 
 * Doctor actions that can be logged (not instructions)
 */
export const DOCTOR_ACTION_TYPES = [
  'medication_changed',
  'monitoring_frequency_adjusted',
  'escalation_advised',
  'referral_made',
  'follow_up_scheduled',
  'target_adjusted',
  'no_action_needed'
];

export function createDoctorActionEvent(actionType, details = {}) {
  if (!DOCTOR_ACTION_TYPES.includes(actionType)) {
    throw new Error(`Invalid action type: ${actionType}`);
  }
  
  return {
    action_type: actionType,
    timestamp: new Date().toISOString(),
    details,
    // This enriches future summaries without changing patient UX
    affects_patient_ux: false
  };
}

/**
 * VALIDATION TEST
 * 
 * Run this mentally for every summary:
 * 
 * 1. Can a doctor understand the patient's state in <30 seconds?
 * 2. Does the summary suggest action without prescribing it?
 * 3. Is there zero advice or optimization language?
 * 4. Is fatigue visible but not dramatized?
 * 5. Is patient voice included verbatim?
 * 
 * If all YES → Summary is valid
 * If any NO → Iterate on compression, not conversation
 */