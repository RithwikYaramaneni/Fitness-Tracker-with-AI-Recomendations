import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRedo } from 'react-icons/fa';

const AIFood = () => {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({
    dietary: []
  });
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [message, setMessage] = useState('');

  const toggleDiet = (diet) => {
    setPrefs(prev => ({
      ...prev,
      dietary: prev.dietary.includes(diet) ? prev.dietary.filter(d => d !== diet) : [...prev.dietary, diet]
    }));
  };

  const generate = async () => {
    try {
      setLoading(true);
      setMessage('');
      const res = await aiAPI.generateFood(prefs);
      setRecommendations(res.data?.data || null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate';
      setMessage(errorMsg);
      setRecommendations(null);
    } finally {
      setLoading(false);
    }
  };

  const saveMeal = async (meal) => {
    try {
      const payload = {
        mealType: meal.mealType || 'meal',
        foods: meal.foods,
        notes: `AI generated: ${meal.name}`
      };
      await aiAPI.saveFood(payload);
      setMessage(`✓ ${meal.name} saved to your nutrition log!`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save meal');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">AI Food Recommendations</h1>
          <p className="text-gray-600">Get personalized meal recommendations based on your profile and goals</p>
        </div>
        <button
          onClick={() => navigate('/nutrition')}
          className="btn-secondary flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Back to Nutrition
        </button>
      </div>

      <div className="card p-4 mb-4">
        <div className="mb-4">
          <label className="label">Dietary Preferences (optional)</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => toggleDiet('vegetarian')} className={`px-3 py-1 rounded ${prefs.dietary.includes('vegetarian') ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Vegetarian</button>
            <button type="button" onClick={() => toggleDiet('vegan')} className={`px-3 py-1 rounded ${prefs.dietary.includes('vegan') ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Vegan</button>
            <button type="button" onClick={() => toggleDiet('keto')} className={`px-3 py-1 rounded ${prefs.dietary.includes('keto') ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Keto</button>
            <button type="button" onClick={() => toggleDiet('paleo')} className={`px-3 py-1 rounded ${prefs.dietary.includes('paleo') ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Paleo</button>
            <button type="button" onClick={() => toggleDiet('gluten_free')} className={`px-3 py-1 rounded ${prefs.dietary.includes('gluten_free') ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Gluten Free</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Leave empty to use your profile dietary preferences</p>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={generate} className="btn-primary flex items-center" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Recommendations'}
          </button>
          {recommendations && (
            <button onClick={generate} className="btn-secondary flex items-center" disabled={loading}>
              <FaRedo className="mr-2" />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.includes('✓') || message.includes('saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
          {message.includes('profile') && (
            <Link to="/profile" className="block mt-2 text-red-800 font-medium hover:underline">
              → Complete your profile
            </Link>
          )}
        </div>
      )}

      {recommendations && (
        <div>
          <div className="card p-4 mb-4 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-lg font-semibold mb-3">Your Daily Targets</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Calories</p>
                <p className="text-xl font-bold text-gray-900">{recommendations.calculatedCalories || recommendations.calories}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Protein</p>
                <p className="text-xl font-bold text-gray-900">{recommendations.macros?.protein || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Carbs</p>
                <p className="text-xl font-bold text-gray-900">{recommendations.macros?.carbs || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fat</p>
                <p className="text-xl font-bold text-gray-900">{recommendations.macros?.fat || 'N/A'}</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-3">Meal Plan</h2>

          <div className="space-y-4">
            {(recommendations.meals || []).map((meal, idx) => {
              // Calculate meal totals
              const mealTotals = (meal.foods || []).reduce((acc, food) => ({
                calories: acc.calories + (food.calories || 0),
                protein: acc.protein + (food.protein || 0),
                carbs: acc.carbs + (food.carbs || 0),
                fat: acc.fat + (food.fat || 0)
              }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

              return (
                <div key={idx} className="card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{meal.name}</h3>
                      <span className="text-sm text-gray-500 capitalize">{meal.mealType}</span>
                    </div>
                    <button onClick={() => saveMeal(meal)} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
                      Save to Log
                    </button>
                  </div>

                  {/* Meal totals */}
                  <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-600">Calories</p>
                        <p className="font-semibold text-gray-900">{Math.round(mealTotals.calories)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Protein</p>
                        <p className="font-semibold text-gray-900">{Math.round(mealTotals.protein)}g</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Carbs</p>
                        <p className="font-semibold text-gray-900">{Math.round(mealTotals.carbs)}g</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Fat</p>
                        <p className="font-semibold text-gray-900">{Math.round(mealTotals.fat)}g</p>
                      </div>
                    </div>
                  </div>

                  {/* Foods list */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Foods:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(meal.foods || []).map((f, i) => (
                        <div key={i} className="p-2 bg-gray-50 rounded border border-gray-100">
                          <div className="font-medium text-sm">{f.name}</div>
                          <div className="text-xs text-gray-500">{f.servingSize} × {f.quantity}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {f.calories} cal • P:{f.protein}g C:{f.carbs}g F:{f.fat}g
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total validation */}
          {recommendations.meals && recommendations.meals.length > 0 && (() => {
            const grandTotal = recommendations.meals.reduce((acc, meal) => {
              const mealTotal = (meal.foods || []).reduce((m, f) => ({
                calories: m.calories + (f.calories || 0),
                protein: m.protein + (f.protein || 0),
                carbs: m.carbs + (f.carbs || 0),
                fat: m.fat + (f.fat || 0)
              }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
              return {
                calories: acc.calories + mealTotal.calories,
                protein: acc.protein + mealTotal.protein,
                carbs: acc.carbs + mealTotal.carbs,
                fat: acc.fat + mealTotal.fat
              };
            }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

            const targetCal = recommendations.calculatedCalories || recommendations.calories;
            const targetProtein = recommendations.macros?.protein ? parseInt(recommendations.macros.protein) : 0;
            const targetCarbs = recommendations.macros?.carbs ? parseInt(recommendations.macros.carbs) : 0;
            const targetFat = recommendations.macros?.fat ? parseInt(recommendations.macros.fat) : 0;

            return (
              <div className="card p-4 mt-4 bg-gradient-to-r from-green-50 to-teal-50">
                <h3 className="font-semibold mb-3">Total Daily Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Calories</p>
                    <p className="text-xl font-bold">{Math.round(grandTotal.calories)}</p>
                    <p className="text-xs text-gray-500">Target: {targetCal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Protein</p>
                    <p className="text-xl font-bold">{Math.round(grandTotal.protein)}g</p>
                    <p className="text-xs text-gray-500">Target: {targetProtein}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Carbs</p>
                    <p className="text-xl font-bold">{Math.round(grandTotal.carbs)}g</p>
                    <p className="text-xs text-gray-500">Target: {targetCarbs}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Fat</p>
                    <p className="text-xl font-bold">{Math.round(grandTotal.fat)}g</p>
                    <p className="text-xs text-gray-500">Target: {targetFat}g</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AIFood;
