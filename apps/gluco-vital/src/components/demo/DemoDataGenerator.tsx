import { subDays, format, addHours, setHours, setMinutes } from "date-fns";

// Generate 30 days of realistic demo data for "Mr. Gluco"
export function generateDemoData() {
  const now = new Date();
  const logs = [];
  const medications = [];
  const adherenceRecords = [];
  const labResults = [];
  const habits = [];
  const doctorVisits = [];
  const reports = [];
  const caregiverAccess = [];
  const aiConversations = [];
  
  // Demo user profile
  const profile = {
    user_email: "demo@glucovital.fit",
    name: "Mr. Gluco",
    age: 52,
    gender: "male",
    timezone: "Asia/Kolkata",
    conditions: ["type2_diabetes", "hypertension"],
    is_on_insulin: false,
    language_preference: "english",
    target_sugar_fasting: 100,
    target_sugar_post_meal: 140,
    target_bp_systolic: 130,
    target_bp_diastolic: 85,
    doctor_name: "Dr. Priya Sharma",
    doctor_specialization: "Diabetologist",
    doctor_phone: "+91 98765 43210",
    doctor_registration_no: "KA-12345",
    prescription_clinic: "HealthFirst Diabetes Center",
    prescription_clinic_address: "456 MG Road, Bangalore 560001",
    prescription_clinic_phone: "+91 80 2345 6789",
    prescription_date: format(subDays(now, 45), "yyyy-MM-dd"),
    prescription_valid_months: 3,
    whatsapp_connected: true,
    medications: [
      { name: "Metformin", dosage: "500mg", frequency: "twice_daily", timing: "after meals" },
      { name: "Glimepiride", dosage: "1mg", frequency: "once_daily", timing: "before breakfast" },
      { name: "Telmisartan", dosage: "40mg", frequency: "once_daily", timing: "morning" }
    ],
    recommended_readings: ["morning_fasting", "after_breakfast", "after_lunch", "after_dinner"]
  };

  // Demo achievements
  const achievements = {
    user_email: "demo@glucovital.fit",
    total_points: 1250,
    current_streak: 12,
    longest_streak: 18,
    last_log_date: format(now, "yyyy-MM-dd"),
    badges: ["first_log", "week_streak", "consistent_logger", "meal_tracker", "medication_master", "bp_tracker"],
    logs_count: 127,
    targets_hit_count: 89,
    weekly_challenge_progress: 5,
    show_on_leaderboard: true,
    display_name: "Mr. Gluco"
  };

  // Caregiver access (family member monitoring)
  caregiverAccess.push({
    id: "demo-caregiver-1",
    patient_email: "demo@glucovital.fit",
    patient_name: "Mr. Gluco",
    caregiver_email: "family@example.com",
    caregiver_name: "Mrs. Gluco",
    caregiver_phone: "+91 98765 12345",
    relation: "spouse",
    access_level: "view_only",
    permissions: ["view_readings", "view_trends", "view_medications", "receive_alerts"],
    status: "active",
    granted_at: subDays(now, 25).toISOString(),
    last_viewed_at: subDays(now, 1).toISOString(),
    alert_preferences: {
      high_sugar: true,
      low_sugar: true,
      missed_medication: false,
      daily_summary: true
    }
  });

  // Doctor visits
  doctorVisits.push(
    {
      id: "demo-visit-1",
      user_email: "demo@glucovital.fit",
      doctor_name: "Dr. Priya Sharma",
      doctor_specialty: "diabetologist",
      visit_type: "routine_checkup",
      visit_date: subDays(now, 45).toISOString(),
      status: "completed",
      clinic_name: "HealthFirst Diabetes Center",
      summary: "HbA1c at 7.8%. Started on Metformin 500mg BD. Advised diet modification and 30 min daily walk.",
      prescriptions_updated: true,
      hba1c_result: 7.8,
      next_visit_recommended: format(subDays(now, -15), "yyyy-MM-dd")
    },
    {
      id: "demo-visit-2",
      user_email: "demo@glucovital.fit",
      doctor_name: "Dr. Priya Sharma",
      doctor_specialty: "diabetologist",
      visit_type: "follow_up",
      visit_date: subDays(now, 7).toISOString(),
      status: "completed",
      clinic_name: "HealthFirst Diabetes Center",
      summary: "Good progress! HbA1c improved to 7.2%. Continue current medications. Keep up the morning walks.",
      prescriptions_updated: false,
      hba1c_result: 7.2,
      tests_ordered: ["Lipid Profile", "Kidney Function"],
      next_visit_recommended: format(subDays(now, -60), "yyyy-MM-dd")
    },
    {
      id: "demo-visit-3",
      user_email: "demo@glucovital.fit",
      doctor_name: "Dr. Priya Sharma",
      doctor_specialty: "diabetologist",
      visit_type: "follow_up",
      visit_date: subDays(now, -15).toISOString(),
      status: "scheduled",
      clinic_name: "HealthFirst Diabetes Center",
      notes: "Review lipid profile results. Discuss exercise routine.",
      reminder_days_before: 2
    }
  );

  // Sample AI conversations/interactions
  aiConversations.push(
    {
      id: "demo-ai-1",
      timestamp: subDays(now, 2).toISOString(),
      trigger: "high_reading",
      reading_value: 198,
      user_message: "Sugar 198 after lunch",
      ai_response: "That's higher than usual for you after lunch. Did you have something different today? Any extra rice or sweets?",
      user_followup: "Yes, had gulab jamun at office party",
      ai_insight: "Occasional treats are okay! Your fasting readings have been good. Maybe balance it with a longer walk this evening?",
      resolved: true
    },
    {
      id: "demo-ai-2", 
      timestamp: subDays(now, 5).toISOString(),
      trigger: "missed_medication",
      ai_response: "I noticed you haven't logged your evening Metformin today. Everything okay?",
      user_message: "Forgot, taking it now",
      ai_insight: "No worries! Logged. You've been consistent 85% of the time this week - that's great!",
      resolved: true
    },
    {
      id: "demo-ai-3",
      timestamp: subDays(now, 1).toISOString(),
      trigger: "pattern_detected",
      ai_response: "I've noticed your post-dinner readings are consistently higher than other times. Would you like some tips for managing evening sugars?",
      user_message: "Yes please",
      ai_insight: "Try having dinner by 8 PM and take a 15-min walk after. Also, reducing rice portion at dinner by 1/4 can help significantly.",
      resolved: true
    }
  );

  // Generate 30 days of health logs
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = subDays(now, daysAgo);
    
    // Fasting sugar (morning, 7-8 AM)
    const fastingTime = setMinutes(setHours(date, 7 + Math.floor(Math.random() * 1)), Math.floor(Math.random() * 60));
    const fastingSugar = 95 + Math.floor(Math.random() * 35) - (daysAgo > 15 ? 0 : Math.floor((15 - daysAgo) * 0.5)); // Improving trend
    logs.push({
      id: `demo-sugar-fasting-${daysAgo}`,
      user_email: "demo@glucovital.fit",
      created_by: "demo@glucovital.fit",
      log_type: "sugar",
      value: `${fastingSugar} mg/dL`,
      numeric_value: fastingSugar,
      time_of_day: "morning_fasting",
      measured_at: fastingTime.toISOString(),
      created_date: fastingTime.toISOString(),
      status: "active",
      source: daysAgo % 3 === 0 ? "whatsapp" : "manual",
      notes: fastingSugar > 110 ? "Missed evening walk yesterday" : null
    });

    // Post-breakfast sugar (10-11 AM)
    if (Math.random() > 0.2) { // 80% chance
      const postBreakfastTime = setMinutes(setHours(date, 10 + Math.floor(Math.random() * 1)), Math.floor(Math.random() * 60));
      const postBreakfastSugar = 130 + Math.floor(Math.random() * 40) - (daysAgo > 15 ? 0 : Math.floor((15 - daysAgo) * 0.8));
      logs.push({
        id: `demo-sugar-pb-${daysAgo}`,
        user_email: "demo@glucovital.fit",
        created_by: "demo@glucovital.fit",
        log_type: "sugar",
        value: `${postBreakfastSugar} mg/dL`,
        numeric_value: postBreakfastSugar,
        time_of_day: "after_breakfast",
        measured_at: postBreakfastTime.toISOString(),
        created_date: postBreakfastTime.toISOString(),
        status: "active",
        source: "whatsapp"
      });
    }

    // Post-lunch sugar (2-3 PM)
    if (Math.random() > 0.3) { // 70% chance
      const postLunchTime = setMinutes(setHours(date, 14 + Math.floor(Math.random() * 1)), Math.floor(Math.random() * 60));
      const postLunchSugar = 140 + Math.floor(Math.random() * 45) - (daysAgo > 15 ? 0 : Math.floor((15 - daysAgo) * 0.7));
      logs.push({
        id: `demo-sugar-pl-${daysAgo}`,
        user_email: "demo@glucovital.fit",
        created_by: "demo@glucovital.fit",
        log_type: "sugar",
        value: `${postLunchSugar} mg/dL`,
        numeric_value: postLunchSugar,
        time_of_day: "after_lunch",
        measured_at: postLunchTime.toISOString(),
        created_date: postLunchTime.toISOString(),
        status: "active",
        source: "manual"
      });
    }

    // Post-dinner sugar (9-10 PM)
    if (Math.random() > 0.25) { // 75% chance
      const postDinnerTime = setMinutes(setHours(date, 21 + Math.floor(Math.random() * 1)), Math.floor(Math.random() * 60));
      const postDinnerSugar = 145 + Math.floor(Math.random() * 50) - (daysAgo > 15 ? 0 : Math.floor((15 - daysAgo) * 0.6));
      logs.push({
        id: `demo-sugar-pd-${daysAgo}`,
        user_email: "demo@glucovital.fit",
        created_by: "demo@glucovital.fit",
        log_type: "sugar",
        value: `${postDinnerSugar} mg/dL`,
        numeric_value: postDinnerSugar,
        time_of_day: "after_dinner",
        measured_at: postDinnerTime.toISOString(),
        created_date: postDinnerTime.toISOString(),
        status: "active",
        source: "whatsapp",
        notes: postDinnerSugar > 170 ? "Had sweets at dinner party" : null
      });
    }

    // Blood Pressure (once daily, morning)
    if (Math.random() > 0.4) { // 60% chance
      const bpTime = setMinutes(setHours(date, 8), Math.floor(Math.random() * 30));
      const systolic = 125 + Math.floor(Math.random() * 20) - (daysAgo > 15 ? 0 : Math.floor((15 - daysAgo) * 0.3));
      const diastolic = 80 + Math.floor(Math.random() * 10);
      logs.push({
        id: `demo-bp-${daysAgo}`,
        user_email: "demo@glucovital.fit",
        created_by: "demo@glucovital.fit",
        log_type: "blood_pressure",
        value: `${systolic}/${diastolic} mmHg`,
        time_of_day: "morning_fasting",
        measured_at: bpTime.toISOString(),
        created_date: bpTime.toISOString(),
        status: "active",
        source: "manual"
      });
    }

    // Meals (2-3 per day)
    const meals = [
      { time: 8, name: "breakfast", foods: ["Idli sambar", "Upma with vegetables", "Poha", "Dosa with chutney", "Oats porridge"] },
      { time: 13, name: "lunch", foods: ["Rice, dal, sabzi", "Roti, chicken curry", "Curd rice", "Biryani (small portion)", "Khichdi"] },
      { time: 20, name: "dinner", foods: ["Chapati, dal, salad", "Vegetable soup", "Grilled fish, rice", "Mixed veg curry, roti", "Paneer tikka, salad"] }
    ];

    meals.forEach((meal, idx) => {
      if (Math.random() > 0.3) {
        const mealTime = setMinutes(setHours(date, meal.time + Math.floor(Math.random() * 1)), Math.floor(Math.random() * 45));
        const food = meal.foods[Math.floor(Math.random() * meal.foods.length)];
        logs.push({
          id: `demo-meal-${daysAgo}-${idx}`,
          user_email: "demo@glucovital.fit",
          created_by: "demo@glucovital.fit",
          log_type: "meal",
          value: food,
          time_of_day: meal.name === "breakfast" ? "after_breakfast" : meal.name === "lunch" ? "after_lunch" : "after_dinner",
          measured_at: mealTime.toISOString(),
          created_date: mealTime.toISOString(),
          status: "active",
          source: "whatsapp",
          notes: `${meal.name.charAt(0).toUpperCase() + meal.name.slice(1)}`
        });
      }
    });

    // Medication logs (2-3 per day)
    if (Math.random() > 0.15) { // 85% adherence
      const medTime = setMinutes(setHours(date, 8), 30);
      logs.push({
        id: `demo-med-morning-${daysAgo}`,
        user_email: "demo@glucovital.fit",
        created_by: "demo@glucovital.fit",
        log_type: "medication",
        value: "Metformin 500mg, Glimepiride 1mg",
        time_of_day: "after_breakfast",
        measured_at: medTime.toISOString(),
        created_date: medTime.toISOString(),
        status: "active",
        source: "whatsapp"
      });

      adherenceRecords.push({
        id: `demo-adh-morning-${daysAgo}`,
        user_email: "demo@glucovital.fit",
        medication_name: "Metformin 500mg",
        scheduled_time: medTime.toISOString(),
        status: "taken",
        taken_at: medTime.toISOString(),
        confirmed_via: "whatsapp"
      });
    }

    if (Math.random() > 0.2) { // 80% evening adherence
      const eveningMedTime = setMinutes(setHours(date, 20), 30);
      logs.push({
        id: `demo-med-evening-${daysAgo}`,
        user_email: "demo@glucovital.fit",
        created_by: "demo@glucovital.fit",
        log_type: "medication",
        value: "Metformin 500mg, Telmisartan 40mg",
        time_of_day: "after_dinner",
        measured_at: eveningMedTime.toISOString(),
        created_date: eveningMedTime.toISOString(),
        status: "active",
        source: "manual"
      });
    }

    // Exercise (3-4 times a week)
    if (daysAgo % 2 === 0 && Math.random() > 0.3) {
      const exerciseTime = setMinutes(setHours(date, 6 + Math.floor(Math.random() * 2)), Math.floor(Math.random() * 30));
      const exercises = ["30 min morning walk", "20 min yoga", "45 min walk in park", "15 min stretching", "30 min cycling"];
      logs.push({
        id: `demo-exercise-${daysAgo}`,
        user_email: "demo@glucovital.fit",
        created_by: "demo@glucovital.fit",
        log_type: "exercise",
        value: exercises[Math.floor(Math.random() * exercises.length)],
        measured_at: exerciseTime.toISOString(),
        created_date: exerciseTime.toISOString(),
        status: "active",
        source: "whatsapp"
      });
    }

    // Occasional symptoms
    if (Math.random() > 0.9) {
      const symptomTime = setMinutes(setHours(date, 15), Math.floor(Math.random() * 60));
      const symptoms = ["Mild headache", "Feeling tired", "Slightly dizzy", "Thirsty"];
      logs.push({
        id: `demo-symptom-${daysAgo}`,
        user_email: "demo@glucovital.fit",
        created_by: "demo@glucovital.fit",
        log_type: "symptom",
        value: symptoms[Math.floor(Math.random() * symptoms.length)],
        measured_at: symptomTime.toISOString(),
        created_date: symptomTime.toISOString(),
        status: "active",
        source: "whatsapp",
        notes: "After skipping lunch"
      });
    }
  }

  // Lab results (comprehensive)
  labResults.push(
    {
      id: "demo-lab-1",
      user_email: "demo@glucovital.fit",
      test_type: "hba1c",
      test_name: "HbA1c",
      value: 7.8,
      unit: "%",
      reference_range_low: 4,
      reference_range_high: 5.6,
      status: "high",
      test_date: format(subDays(now, 90), "yyyy-MM-dd"),
      lab_name: "Apollo Diagnostics",
      verified: true,
      notes: "Initial diagnosis reading"
    },
    {
      id: "demo-lab-2",
      user_email: "demo@glucovital.fit",
      test_type: "hba1c",
      test_name: "HbA1c",
      value: 7.2,
      unit: "%",
      reference_range_low: 4,
      reference_range_high: 5.6,
      status: "high",
      test_date: format(subDays(now, 7), "yyyy-MM-dd"),
      lab_name: "Apollo Diagnostics",
      verified: true,
      ai_insight: "Your HbA1c has improved by 0.6% in 3 months. This shows your lifestyle changes are working!"
    },
    {
      id: "demo-lab-3",
      user_email: "demo@glucovital.fit",
      test_type: "fasting_glucose",
      test_name: "Fasting Glucose",
      value: 118,
      unit: "mg/dL",
      reference_range_low: 70,
      reference_range_high: 100,
      status: "high",
      test_date: format(subDays(now, 7), "yyyy-MM-dd"),
      lab_name: "Apollo Diagnostics",
      verified: true
    },
    {
      id: "demo-lab-4",
      user_email: "demo@glucovital.fit",
      test_type: "total_cholesterol",
      test_name: "Total Cholesterol",
      value: 195,
      unit: "mg/dL",
      reference_range_low: 0,
      reference_range_high: 200,
      status: "normal",
      test_date: format(subDays(now, 7), "yyyy-MM-dd"),
      lab_name: "Apollo Diagnostics",
      verified: true
    },
    {
      id: "demo-lab-5",
      user_email: "demo@glucovital.fit",
      test_type: "creatinine",
      test_name: "Creatinine",
      value: 0.9,
      unit: "mg/dL",
      reference_range_low: 0.7,
      reference_range_high: 1.3,
      status: "normal",
      test_date: format(subDays(now, 7), "yyyy-MM-dd"),
      lab_name: "Apollo Diagnostics",
      verified: true,
      ai_insight: "Kidney function is normal. Important to monitor regularly with diabetes."
    }
  );

  // Weekly health report
  reports.push({
    id: "demo-report-1",
    user_email: "demo@glucovital.fit",
    report_type: "weekly",
    start_date: format(subDays(now, 7), "yyyy-MM-dd"),
    end_date: format(now, "yyyy-MM-dd"),
    created_date: now.toISOString(),
    summary: "Good week overall! Your fasting sugars have been consistently in the 95-115 range, showing improvement. Post-meal readings are slightly elevated after dinner - consider lighter evening meals. Medication adherence was 92% this week. Keep up the morning walks!",
    personal_notes: "Feeling more energetic this week. The evening walks are helping.",
    sugar_stats: {
      average: 128,
      highest: 198,
      lowest: 92,
      readings_count: 24,
      in_target_percent: 71,
      fasting_avg: 105,
      post_meal_avg: 148,
      trend: "improving"
    },
    bp_stats: {
      avg_systolic: 128,
      avg_diastolic: 82,
      readings_count: 5,
      highest_systolic: 138,
      lowest_systolic: 122,
      in_target_percent: 80
    },
    medication_adherence: 92,
    adherence_details: {
      total_expected: 14,
      total_taken: 13,
      missed_count: 1,
      by_medication: [
        { name: "Metformin", taken: 13, expected: 14 },
        { name: "Glimepiride", taken: 7, expected: 7 }
      ]
    },
    risks_identified: [
      "Post-dinner readings consistently above 160 mg/dL",
      "One missed medication dose on Thursday"
    ],
    recommendations: [
      "Try having dinner before 8 PM",
      "Reduce rice portion at dinner by 25%",
      "Continue morning walks - they're helping your fasting numbers",
      "Set a phone alarm for evening medication"
    ],
    achievements: [
      "12-day logging streak! 🔥",
      "Fasting average improved by 8 mg/dL from last week",
      "Completed 5 out of 7 exercise goals"
    ],
    questions_for_doctor: [
      "Should I adjust my dinner timing?",
      "Is my HbA1c improvement on track?",
      "When should I schedule my next lipid profile?"
    ],
    chart_preferences: {
      sugar_chart_type: "line",
      bp_chart_type: "line",
      show_targets: true
    },
    accessible_to_caregivers: true
  });

  // Medication reminders
  medications.push(
    {
      id: "demo-reminder-1",
      user_email: "demo@glucovital.fit",
      medication_name: "Metformin",
      dosage: "500mg",
      timing_type: "after_meal",
      frequency: "twice_daily",
      specific_times: ["08:30", "20:30"],
      is_active: true,
      pills_remaining: 45,
      refill_threshold: 7
    },
    {
      id: "demo-reminder-2",
      user_email: "demo@glucovital.fit",
      medication_name: "Glimepiride",
      dosage: "1mg",
      timing_type: "before_meal",
      frequency: "once_daily",
      specific_times: ["07:30"],
      is_active: true,
      pills_remaining: 22
    },
    {
      id: "demo-reminder-3",
      user_email: "demo@glucovital.fit",
      medication_name: "Telmisartan",
      dosage: "40mg",
      timing_type: "specific_time",
      frequency: "once_daily",
      specific_times: ["08:00"],
      is_active: true,
      pills_remaining: 18
    }
  );

  // Add a corrected entry to demonstrate the feature
  logs.push({
    id: "demo-corrected-1",
    user_email: "demo@glucovital.fit",
    created_by: "demo@glucovital.fit",
    log_type: "sugar",
    value: "250 mg/dL",
    numeric_value: 250,
    time_of_day: "after_lunch",
    measured_at: subDays(now, 3).toISOString(),
    created_date: subDays(now, 3).toISOString(),
    status: "corrected", // This entry was corrected
    source: "whatsapp",
    notes: "Wrong reading - meter error. Corrected to 150."
  });

  // The corrected value
  logs.push({
    id: "demo-corrected-1-fixed",
    user_email: "demo@glucovital.fit",
    created_by: "demo@glucovital.fit",
    log_type: "sugar",
    value: "150 mg/dL",
    numeric_value: 150,
    time_of_day: "after_lunch",
    measured_at: subDays(now, 3).toISOString(),
    created_date: subDays(now, 3).toISOString(),
    status: "active",
    source: "whatsapp",
    notes: "Corrected reading"
  });

  // Sort logs by date descending
  logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  // Daily habits for tracking
  habits.push(
    {
      id: "demo-habit-1",
      user_email: "demo@glucovital.fit",
      habit_type: "walking",
      habit_name: "Morning Walk",
      target_value: 30,
      target_unit: "minutes",
      frequency: "daily",
      is_active: true,
      current_streak: 8,
      longest_streak: 12
    },
    {
      id: "demo-habit-2",
      user_email: "demo@glucovital.fit",
      habit_type: "water_intake",
      habit_name: "Drink Water",
      target_value: 8,
      target_unit: "glasses",
      frequency: "daily",
      is_active: true,
      current_streak: 5,
      longest_streak: 10
    },
    {
      id: "demo-habit-3",
      user_email: "demo@glucovital.fit",
      habit_type: "foot_check",
      habit_name: "Foot Check",
      target_value: 1,
      target_unit: "times",
      frequency: "daily",
      is_active: true,
      current_streak: 3,
      longest_streak: 7
    }
  );

  return {
    profile,
    achievements,
    logs,
    medications,
    adherenceRecords,
    labResults,
    habits,
    doctorVisits,
    reports,
    caregiverAccess,
    aiConversations,
    user: {
      email: "demo@glucovital.fit",
      full_name: "Mr. Gluco",
      role: "user"
    }
  };
}

export const DEMO_USER_EMAIL = "demo@glucovital.fit";