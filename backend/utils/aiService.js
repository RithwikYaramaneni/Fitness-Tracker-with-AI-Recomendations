const fetch = global.fetch || require('node-fetch');

const callModel = async (prompt, maxTokens = 800) => {
  // Prefer Gemini (Google) if API key provided
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || 'models/gemini-1.5-flash';

  if (geminiKey) {
    // Choose endpoint format based on model name (Gemini vs PaLM/Bison)
    const isGemini = /gemini/i.test(geminiModel);

    let url;
    let body;
    if (isGemini) {
      // Gemini models use v1beta generateContent with contents structure
      url = `https://generativelanguage.googleapis.com/v1beta/${geminiModel}:generateContent?key=${geminiKey}`;
      body = {
        contents: [
          { role: 'user', parts: [{ text: 'You are a helpful nutrition assistant that outputs structured JSON only.' }] },
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: { 
          temperature: 0.9,  // Higher temperature for more variety
          topP: 0.95,
          topK: 40
        }
      };
    } else {
      // Legacy PaLM/Bison chat models (text-bison/chat-bison) use v1beta2 generateMessage
      url = `https://generativelanguage.googleapis.com/v1beta2/${geminiModel}:generateMessage?key=${geminiKey}`;
      body = {
        messages: [
          { author: 'system', content: [{ text: 'You are a helpful nutrition assistant that outputs structured JSON only.' }] },
          { author: 'user', content: [{ text: prompt }] }
        ],
        temperature: 0.7
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Gemini API error: ${res.status} ${txt}`);
    }

    const json = await res.json();

    // Attempt to extract text from common response shapes
    let content = null;
    if (isGemini) {
      const cand = json.candidates?.[0];
      const parts = cand?.content?.parts || cand?.content?.[0]?.parts;
      if (Array.isArray(parts)) {
        content = parts.map(p => p.text).filter(Boolean).join('\n');
      }
      // Fallbacks
      if (!content && cand?.content?.text) content = cand.content.text;
      if (!content && cand?.text) content = cand.text;
    } else {
      const candidate = json.candidates?.[0] || null;
      if (candidate) {
        if (candidate.content && Array.isArray(candidate.content) && candidate.content[0]?.text) {
          content = candidate.content.map(c => c.text).join('\n');
        } else if (candidate.output) {
          content = candidate.output;
        } else if (candidate.text) {
          content = candidate.text;
        }
      }
    }

    // As a fallback, try other fields
    if (!content) {
      content = JSON.stringify(json);
    }

    return content;
  }

  // Fallback to OpenAI if configured
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful nutrition assistant that outputs structured JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI API error: ${res.status} ${text}`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    return content;
  }

  throw new Error('No AI API key configured (set GEMINI_API_KEY or OPENAI_API_KEY)');
};

// Fallback local generator: returns simple structured recommendation based on preferences
const fallbackGenerate = (prefs) => {
  const { goal = 'maintain', dietary = [], calories = 2000, targetMacros } = prefs;
  
  // Calculate targets if not provided
  const proteinTarget = targetMacros?.protein || Math.round(calories * 0.3 / 4);
  const carbsTarget = targetMacros?.carbs || Math.round(calories * 0.4 / 4);
  const fatTarget = targetMacros?.fat || Math.round(calories * 0.3 / 9);

  // Distribute calories: breakfast 30%, lunch 40%, dinner 30%
  const breakfastCal = Math.round(calories * 0.30);
  const lunchCal = Math.round(calories * 0.40);
  const dinnerCal = calories - breakfastCal - lunchCal; // ensures exact total

  // Distribute macros proportionally
  const breakfastProtein = Math.round(proteinTarget * 0.25);
  const lunchProtein = Math.round(proteinTarget * 0.40);
  const dinnerProtein = proteinTarget - breakfastProtein - lunchProtein;

  const breakfastCarbs = Math.round(carbsTarget * 0.35);
  const lunchCarbs = Math.round(carbsTarget * 0.35);
  const dinnerCarbs = carbsTarget - breakfastCarbs - lunchCarbs;

  const breakfastFat = Math.round(fatTarget * 0.25);
  const lunchFat = Math.round(fatTarget * 0.35);
  const dinnerFat = fatTarget - breakfastFat - lunchFat;

  const isVegan = dietary.includes('vegan');
  const isVegetarian = dietary.includes('vegetarian') || isVegan;

  // Add variety by randomly selecting from different options
  const breakfastOptions = [
    { name: 'Oatmeal', base: 'grain' },
    { name: 'Whole wheat toast', base: 'grain' },
    { name: 'Quinoa bowl', base: 'grain' },
    { name: 'Smoothie bowl', base: 'grain' }
  ];
  
  const proteinOptions = isVegetarian 
    ? ['Chickpeas', 'Lentils', 'Black beans', 'Tofu', 'Tempeh', 'Edamame']
    : ['Grilled chicken breast', 'Turkey breast', 'Salmon', 'Tuna', 'Lean beef', 'Shrimp'];
    
  const grainOptions = ['Brown rice', 'Quinoa', 'Whole wheat pasta', 'Couscous', 'Farro', 'Wild rice'];
  
  const veggieOptions = ['Mixed vegetables', 'Roasted Brussels sprouts', 'Steamed broccoli', 'Sautéed spinach', 'Grilled asparagus', 'Roasted bell peppers'];

  // Randomize selections
  const randomBreakfast = breakfastOptions[Math.floor(Math.random() * breakfastOptions.length)];
  const randomProtein = proteinOptions[Math.floor(Math.random() * proteinOptions.length)];
  const randomGrain = grainOptions[Math.floor(Math.random() * grainOptions.length)];
  const randomVeggie = veggieOptions[Math.floor(Math.random() * veggieOptions.length)];
  const randomDinnerProtein = proteinOptions[Math.floor(Math.random() * proteinOptions.length)];

  const meals = [
    {
      mealType: 'breakfast',
      name: `${randomBreakfast.name} Power Breakfast (${dietary.join(', ') || 'balanced'})`,
      foods: [
        { 
          name: randomBreakfast.name, 
          calories: Math.round(breakfastCal * 0.45), 
          protein: Math.round(breakfastProtein * 0.3), 
          carbs: Math.round(breakfastCarbs * 0.5), 
          fat: Math.round(breakfastFat * 0.2), 
          servingSize: '1 cup', 
          quantity: 1 
        },
        { 
          name: isVegan ? 'Almond butter' : 'Greek yogurt', 
          calories: Math.round(breakfastCal * 0.35), 
          protein: Math.round(breakfastProtein * 0.5), 
          carbs: Math.round(breakfastCarbs * 0.2), 
          fat: Math.round(breakfastFat * 0.5), 
          servingSize: isVegan ? '2 tbsp' : '150g', 
          quantity: 1 
        },
        { 
          name: 'Berries', 
          calories: breakfastCal - Math.round(breakfastCal * 0.45) - Math.round(breakfastCal * 0.35), 
          protein: breakfastProtein - Math.round(breakfastProtein * 0.3) - Math.round(breakfastProtein * 0.5), 
          carbs: breakfastCarbs - Math.round(breakfastCarbs * 0.5) - Math.round(breakfastCarbs * 0.2), 
          fat: breakfastFat - Math.round(breakfastFat * 0.2) - Math.round(breakfastFat * 0.5), 
          servingSize: '1 cup', 
          quantity: 1 
        }
      ]
    },
    {
      mealType: 'lunch',
      name: `${randomProtein} & ${randomGrain} Bowl`,
      foods: [
        { 
          name: randomProtein, 
          calories: Math.round(lunchCal * 0.45), 
          protein: Math.round(lunchProtein * 0.6), 
          carbs: Math.round(lunchCarbs * 0.2), 
          fat: Math.round(lunchFat * 0.3), 
          servingSize: '200g', 
          quantity: 1 
        },
        { 
          name: randomGrain, 
          calories: Math.round(lunchCal * 0.35), 
          protein: Math.round(lunchProtein * 0.2), 
          carbs: Math.round(lunchCarbs * 0.6), 
          fat: Math.round(lunchFat * 0.2), 
          servingSize: '1 cup', 
          quantity: 1 
        },
        { 
          name: randomVeggie, 
          calories: lunchCal - Math.round(lunchCal * 0.45) - Math.round(lunchCal * 0.35), 
          protein: lunchProtein - Math.round(lunchProtein * 0.6) - Math.round(lunchProtein * 0.2), 
          carbs: lunchCarbs - Math.round(lunchCarbs * 0.2) - Math.round(lunchCarbs * 0.6), 
          fat: lunchFat - Math.round(lunchFat * 0.3) - Math.round(lunchFat * 0.2), 
          servingSize: '2 cups', 
          quantity: 1 
        }
      ]
    },
    {
      mealType: 'dinner',
      name: `${randomDinnerProtein} Dinner Plate`,
      foods: [
        { 
          name: randomDinnerProtein, 
          calories: Math.round(dinnerCal * 0.50), 
          protein: Math.round(dinnerProtein * 0.65), 
          carbs: Math.round(dinnerCarbs * 0.1), 
          fat: Math.round(dinnerFat * 0.6), 
          servingSize: '180g', 
          quantity: 1 
        },
        { 
          name: 'Sweet potato', 
          calories: Math.round(dinnerCal * 0.30), 
          protein: Math.round(dinnerProtein * 0.15), 
          carbs: Math.round(dinnerCarbs * 0.7), 
          fat: Math.round(dinnerFat * 0.1), 
          servingSize: '1 medium', 
          quantity: 1 
        },
        { 
          name: 'Steamed broccoli', 
          calories: dinnerCal - Math.round(dinnerCal * 0.50) - Math.round(dinnerCal * 0.30), 
          protein: dinnerProtein - Math.round(dinnerProtein * 0.65) - Math.round(dinnerProtein * 0.15), 
          carbs: dinnerCarbs - Math.round(dinnerCarbs * 0.1) - Math.round(dinnerCarbs * 0.7), 
          fat: dinnerFat - Math.round(dinnerFat * 0.6) - Math.round(dinnerFat * 0.1), 
          servingSize: '2 cups', 
          quantity: 1 
        }
      ]
    }
  ];

  return { goal, dietary, calories, meals };
};

const generateFoodRecommendations = async (prefs) => {
  // Build structured prompt with macro targets
  const { goal, dietary, calories, targetMacros } = prefs;
  const macroInfo = targetMacros 
    ? `STRICT TARGETS - Total daily must hit these exactly:
  - Protein: ${targetMacros.protein}g (±5g acceptable)
  - Carbs: ${targetMacros.carbs}g (±10g acceptable)
  - Fat: ${targetMacros.fat}g (±5g acceptable)`
    : '';
  
  // Add timestamp to prompt for variety
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 1000);
  
  const prompt = `You are a nutrition expert. Generate 3 UNIQUE and VARIED meal recommendations (breakfast, lunch, dinner) for a user with:
- Goal: ${goal}
- TOTAL daily calories: ${calories} (all 3 meals combined must equal this)
- Dietary restrictions: ${dietary.join(', ') || 'none'}
${macroInfo}

CRITICAL REQUIREMENTS:
1. The SUM of all foods across all 3 meals MUST equal ${calories} calories (±50 calories)
2. The SUM of protein across all meals MUST equal ${targetMacros ? targetMacros.protein + 'g' : 'balanced'}
3. The SUM of carbs across all meals MUST equal ${targetMacros ? targetMacros.carbs + 'g' : 'balanced'}
4. The SUM of fat across all meals MUST equal ${targetMacros ? targetMacros.fat + 'g' : 'balanced'}
5. Use realistic portion sizes and accurate nutrition values
6. Distribute calories roughly: breakfast 25-30%, lunch 35-40%, dinner 30-35%

VARIETY REQUIREMENTS:
- Generate DIFFERENT meals each time - avoid repeating the same foods
- Use diverse protein sources (fish, poultry, legumes, tofu, eggs, etc.)
- Include variety in grains (rice, quinoa, pasta, bread, oats, etc.)
- Mix different vegetables and fruits
- Try different cuisines (Mediterranean, Asian, Mexican, etc.)
- Be creative with meal names and combinations
- Random seed for variety: ${randomSeed}

IMPORTANT: Calculate and verify that your meal plan totals hit the targets before responding.

Respond only with valid JSON in this exact format:
{
  "goal": "${goal}",
  "dietary": ${JSON.stringify(dietary)},
  "calories": ${calories},
  "meals": [
    {
      "mealType": "breakfast",
      "name": "Meal name",
      "foods": [
        {
          "name": "Food item name",
          "calories": 200,
          "protein": 15,
          "carbs": 25,
          "fat": 8,
          "servingSize": "1 cup",
          "quantity": 1
        }
      ]
    },
    {
      "mealType": "lunch",
      "name": "Meal name",
      "foods": [...]
    },
    {
      "mealType": "dinner",
      "name": "Meal name",
      "foods": [...]
    }
  ]
}`;

  try {
    const content = await callModel(prompt, 1500);
    // If the model returned an object already, assume it's parsed
    if (typeof content === 'object' && content !== null) return content;

    // content is expected to be a string containing JSON
    let jsonText = content;
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      // try extracting the first JSON object in the text
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = jsonText.slice(start, end + 1);
        try {
          return JSON.parse(candidate);
        } catch (e2) {
          // fall through to fallback
        }
      }
    }
  } catch (err) {
    console.warn('AI model call failed or not configured, using fallback generator:', err.message);
    return fallbackGenerate(prefs);
  }
};

// Generate workout plan based on user profile and history
const generateWorkoutPlan = async (userProfile) => {
  const {
    age,
    gender,
    weight,
    height,
    fitnessGoal,
    equipmentAvailable,
    experienceLevel,
    workoutFrequency,
    injuries,
    previousWorkouts,
    personalRecords,
    streak
  } = userProfile;

  const prompt = `You are an expert personal trainer. Generate a personalized weekly workout plan for:

USER PROFILE:
- Age: ${age}, Gender: ${gender}
- Weight: ${weight}kg, Height: ${height}cm
- Fitness Goal: ${fitnessGoal}
- Experience Level: ${experienceLevel}
- Available Equipment: ${equipmentAvailable.join(', ') || 'bodyweight only'}
- Workout Frequency: ${workoutFrequency} days/week
${injuries && injuries.length > 0 ? `- Injuries/Limitations: ${injuries.join(', ')}` : ''}
${streak && streak.current > 0 ? `- Current Streak: ${streak.current} days (longest: ${streak.longest})` : ''}

${previousWorkouts && previousWorkouts.length > 0 ? `
RECENT WORKOUTS (last 5):
${previousWorkouts.map((w, i) => `${i + 1}. ${w.type} - ${w.exercises?.length || 0} exercises`).join('\n')}
` : ''}

${personalRecords && Object.keys(personalRecords).length > 0 ? `
PERSONAL RECORDS:
${Object.entries(personalRecords).map(([exercise, record]) => `- ${exercise}: ${record.weight}kg x ${record.reps} reps`).join('\n')}
` : ''}

REQUIREMENTS:
1. Generate ${workoutFrequency} workout days (e.g., Monday, Wednesday, Friday if 3/week)
2. Each workout should have 6-10 exercises with sets and reps
3. Include specific warm-up and cool-down for each day
4. Progress intensity based on experience level (${experienceLevel})
5. Adapt exercises for available equipment: ${equipmentAvailable.join(', ')}
6. Consider any injuries/limitations: ${injuries && injuries.length > 0 ? injuries.join(', ') : 'none'}
7. Add a personalized motivation tip based on streak: ${streak?.current || 0} days
8. For ${fitnessGoal}, structure workouts accordingly (e.g., compound lifts for muscle gain, circuits for fat loss)

RESPOND ONLY WITH VALID JSON in this exact format:
{
  "weeklyGoal": "Brief description of the week's focus",
  "dailyWorkouts": [
    {
      "day": "Monday",
      "goal": "Upper Body Strength",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "Focus on controlled movement"
        }
      ],
      "warmup": "5 min light cardio + dynamic stretches",
      "cooldown": "5 min stretching focusing on chest and shoulders",
      "notes": "Keep rest periods strict"
    }
  ],
  "motivation": "Personalized motivation message based on ${streak?.current || 0} day streak"
}`;

  try {
    const content = await callModel(prompt, 2000);
    
    // If the model returned an object already
    if (typeof content === 'object' && content !== null) return content;

    // Parse JSON from string
    let jsonText = content;
    try {
      return JSON.parse(jsonText);
    } catch (e) {
      // Try extracting JSON from response
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = jsonText.slice(start, end + 1);
        return JSON.parse(candidate);
      }
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (err) {
    console.warn('AI model call failed, using fallback workout generator:', err.message);
    // Return a basic fallback workout plan
    return generateFallbackWorkout(userProfile);
  }
};

// Fallback workout generator
const generateFallbackWorkout = (userProfile) => {
  const { fitnessGoal, experienceLevel, workoutFrequency, equipmentAvailable } = userProfile;
  
  const hasGym = equipmentAvailable.includes('gym_access');
  const hasDumbbells = equipmentAvailable.includes('dumbbells') || hasGym;
  
  // Generate correct number of days based on frequency
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let days = [];
  
  if (workoutFrequency <= 3) {
    days = ['Monday', 'Wednesday', 'Friday'].slice(0, workoutFrequency);
  } else if (workoutFrequency === 4) {
    days = ['Monday', 'Tuesday', 'Thursday', 'Friday'];
  } else if (workoutFrequency === 5) {
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  } else if (workoutFrequency === 6) {
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  } else {
    days = allDays; // 7 days
  }
  
  const dailyWorkouts = days.map((day, idx) => {
    let goal, exercises;
    
    // Cycle through workout types for variety
    const workoutType = idx % 7;
    
    if (workoutType === 0 || workoutType === 3) {
      goal = 'Upper Body Strength';
      exercises = hasDumbbells ? [
        { name: 'Push-ups', sets: 3, reps: '10-15', restSeconds: 60, notes: 'Keep core tight' },
        { name: 'Dumbbell Rows', sets: 3, reps: '10-12', restSeconds: 60, notes: 'Pull to hip' },
        { name: 'Shoulder Press', sets: 3, reps: '8-10', restSeconds: 90, notes: 'Control the descent' },
        { name: 'Bicep Curls', sets: 3, reps: '12-15', restSeconds: 45, notes: 'No swinging' },
        { name: 'Tricep Dips', sets: 3, reps: '10-12', restSeconds: 60, notes: 'Keep elbows close' }
      ] : [
        { name: 'Push-ups', sets: 3, reps: '10-15', restSeconds: 60, notes: 'Keep core tight' },
        { name: 'Pike Push-ups', sets: 3, reps: '8-10', restSeconds: 60, notes: 'For shoulders' },
        { name: 'Diamond Push-ups', sets: 3, reps: '8-12', restSeconds: 60, notes: 'For triceps' },
        { name: 'Plank', sets: 3, reps: '30-45 sec', restSeconds: 45, notes: 'Hold steady' }
      ];
    } else if (workoutType === 1 || workoutType === 4) {
      goal = 'Lower Body & Core';
      exercises = [
        { name: 'Squats', sets: 4, reps: '12-15', restSeconds: 90, notes: 'Depth is key' },
        { name: 'Lunges', sets: 3, reps: '10 each leg', restSeconds: 60, notes: 'Control balance' },
        { name: 'Glute Bridges', sets: 3, reps: '15-20', restSeconds: 45, notes: 'Squeeze at top' },
        { name: 'Plank', sets: 3, reps: '45-60 sec', restSeconds: 45, notes: 'Keep hips level' },
        { name: 'Russian Twists', sets: 3, reps: '20 total', restSeconds: 45, notes: 'Core control' }
      ];
    } else if (workoutType === 2 || workoutType === 5) {
      goal = 'Full Body Circuit';
      exercises = [
        { name: 'Burpees', sets: 3, reps: '10-12', restSeconds: 60, notes: 'Explosive movement' },
        { name: 'Mountain Climbers', sets: 3, reps: '20 total', restSeconds: 45, notes: 'Fast pace' },
        { name: 'Jump Squats', sets: 3, reps: '10-12', restSeconds: 60, notes: 'Land softly' },
        { name: 'Plank to Downdog', sets: 3, reps: '12-15', restSeconds: 45, notes: 'Fluid motion' },
        { name: 'High Knees', sets: 3, reps: '30 sec', restSeconds: 30, notes: 'Cardio burst' }
      ];
    } else {
      goal = 'Active Recovery & Cardio';
      exercises = [
        { name: 'Light Jogging', sets: 1, reps: '20 min', restSeconds: 0, notes: 'Moderate pace' },
        { name: 'Walking Lunges', sets: 2, reps: '15 each leg', restSeconds: 45, notes: 'Focus on form' },
        { name: 'Yoga Flow', sets: 1, reps: '15 min', restSeconds: 0, notes: 'Stretch and relax' },
        { name: 'Foam Rolling', sets: 1, reps: '10 min', restSeconds: 0, notes: 'Target sore areas' }
      ];
    }
    
    return {
      day,
      goal,
      exercises,
      warmup: '5-10 minutes light cardio (jogging, jumping jacks) + dynamic stretching',
      cooldown: '5-10 minutes static stretching focusing on worked muscles',
      notes: `${experienceLevel === 'beginner' ? 'Take your time learning form.' : 'Push yourself but maintain form.'}`
    };
  });
  
  return {
    weeklyGoal: `${fitnessGoal.replace('_', ' ')} - ${workoutFrequency} days/week`,
    dailyWorkouts,
    motivation: 'Every workout brings you closer to your goals. Stay consistent!'
  };
};

module.exports = {
  generateFoodRecommendations,
  generateWorkoutPlan
};
