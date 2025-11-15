import React, { useState, useEffect } from 'react';
import { FaAppleAlt, FaPlus, FaTrash, FaRobot } from 'react-icons/fa';
import { nutritionAPI } from '../services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const Nutrition = () => {
  const [meals, setMeals] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    mealType: 'breakfast',
    foods: [],
    notes: ''
  });

  useEffect(() => {
    fetchMeals();
    fetchDailySummary();
  }, []);

  const fetchMeals = async () => {
    try {
      const response = await nutritionAPI.getMeals({ limit: 10 });
      if (response.data.success) {
        setMeals(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async () => {
    try {
      const response = await nutritionAPI.getDailySummary();
      if (response.data.success) {
        setDailySummary(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
    }
  };

  const handleAddFood = () => {
    setFormData(prev => ({
      ...prev,
      foods: [
        ...prev.foods,
        { name: '', calories: 0, protein: 0, carbs: 0, fat: 0, servingSize: '100g', quantity: 1 }
      ]
    }));
  };

  const handleFoodChange = (index, field, value) => {
    setFormData(prev => {
      const newFoods = [...prev.foods];
      newFoods[index] = { ...newFoods[index], [field]: value };
      return { ...prev, foods: newFoods };
    });
  };

  const handleRemoveFood = (index) => {
    setFormData(prev => ({
      ...prev,
      foods: prev.foods.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.foods.length === 0) {
      alert('Please add at least one food item');
      return;
    }
    try {
      const response = await nutritionAPI.createMeal(formData);
      if (response.data.success) {
        setShowModal(false);
        fetchMeals();
        fetchDailySummary();
        resetForm();
      }
    } catch (error) {
      console.error('Error logging meal:', error);
      alert('Failed to log meal. Please try again.');
    }
  };

  const handleDeleteMeal = async (id) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await nutritionAPI.deleteMeal(id);
        fetchMeals();
        fetchDailySummary();
      } catch (error) {
        console.error('Error deleting meal:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      mealType: 'breakfast',
      foods: [],
      notes: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FaAppleAlt className="mr-3 text-green-600" />
            Nutrition
          </h1>
          <p className="text-gray-600 mt-2">Track your meals and nutrition</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" />
            Log Meal
          </button>
          <Link to="/ai-food" className="btn-secondary flex items-center">
            <FaRobot className="mr-2" />
            AI Suggestions
          </Link>
        </div>
      </div>

      {/* Daily Summary */}
      {dailySummary && (
        <div className="card mb-8 bg-gradient-to-r from-green-50 to-blue-50">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Summary</h2>
          {dailySummary.calorieGoal > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Calories</p>
                  <p className="text-2xl font-bold text-gray-900">{dailySummary.totalCalories}</p>
                  <p className="text-xs text-gray-500">Goal: {dailySummary.calorieGoal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Protein</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(dailySummary.totalProtein)}g</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Carbs</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(dailySummary.totalCarbs)}g</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fat</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(dailySummary.totalFat)}g</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className={`text-2xl font-bold ${dailySummary.caloriesRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dailySummary.caloriesRemaining}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-3">Complete your profile to see personalized calorie goals</p>
              <Link to="/profile" className="text-primary-600 hover:text-primary-700 font-medium">
                Update Profile →
              </Link>
            </div>
          )}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  dailySummary.percentageOfGoal > 100 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(dailySummary.percentageOfGoal, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {dailySummary.percentageOfGoal}% of daily goal
            </p>
          </div>
        </div>
      )}

      {/* Meals List */}
      <div className="space-y-4">
        {meals.length === 0 ? (
          <div className="text-center py-12 card">
            <FaAppleAlt className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No meals logged yet. Start tracking your nutrition!</p>
          </div>
        ) : (
          meals.map(meal => (
            <div key={meal._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full capitalize mr-3">
                      {meal.mealType}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(meal.date), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Calories</p>
                      <p className="text-lg font-semibold">{meal.totalCalories}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Protein</p>
                      <p className="text-lg font-semibold">{Math.round(meal.totalProtein)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Carbs</p>
                      <p className="text-lg font-semibold">{Math.round(meal.totalCarbs)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Fat</p>
                      <p className="text-lg font-semibold">{Math.round(meal.totalFat)}g</p>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600 mb-2">Foods:</p>
                    <ul className="space-y-1">
                      {meal.foods.map((food, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          • {food.name} ({food.servingSize}) - {food.calories} cal
                        </li>
                      ))}
                    </ul>
                  </div>

                  {meal.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">{meal.notes}</p>
                  )}
                </div>
                
                <button
                  onClick={() => handleDeleteMeal(meal._id)}
                  className="ml-4 text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Log Meal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Log Meal</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="label">Meal Type</label>
                  <select
                    value={formData.mealType}
                    onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                    className="input-field"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="label mb-0">Food Items</label>
                    <button
                      type="button"
                      onClick={handleAddFood}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <FaPlus className="mr-1" />
                      Add Food
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {formData.foods.map((food, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <input
                            type="text"
                            placeholder="Food name"
                            value={food.name}
                            onChange={(e) => handleFoodChange(index, 'name', e.target.value)}
                            className="input-field text-sm"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFood(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <input
                            type="number"
                            placeholder="Calories"
                            value={food.calories || ''}
                            onChange={(e) => handleFoodChange(index, 'calories', parseFloat(e.target.value))}
                            className="input-field text-sm"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Protein (g)"
                            value={food.protein || ''}
                            onChange={(e) => handleFoodChange(index, 'protein', parseFloat(e.target.value))}
                            className="input-field text-sm"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Carbs (g)"
                            value={food.carbs || ''}
                            onChange={(e) => handleFoodChange(index, 'carbs', parseFloat(e.target.value))}
                            className="input-field text-sm"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            placeholder="Fat (g)"
                            value={food.fat || ''}
                            onChange={(e) => handleFoodChange(index, 'fat', parseFloat(e.target.value))}
                            className="input-field text-sm"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Serving"
                            value={food.servingSize}
                            onChange={(e) => handleFoodChange(index, 'servingSize', e.target.value)}
                            className="input-field text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            value={food.quantity}
                            onChange={(e) => handleFoodChange(index, 'quantity', parseFloat(e.target.value))}
                            className="input-field text-sm"
                            min="0.1"
                            step="0.1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    rows="3"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Meal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nutrition;
