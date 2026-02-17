import React, { useState, useEffect } from 'react';
import { Camera, Utensils, TrendingUp, Target, Plus, X, Check, Shield } from 'lucide-react';

const FoodLoggerApp = () => {
  const [activeTab, setActiveTab] = useState('log');
  const [meals, setMeals] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualEntry, setManualEntry] = useState('');
  const [feedback, setFeedback] = useState(null);
  
  // Daily goals
  const dailyGoals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 65
  };

  // Load meals from localStorage
  useEffect(() => {
    try {
      const savedMeals = localStorage.getItem('meals');
      if (savedMeals) {
        const parsedMeals = JSON.parse(savedMeals);
        const mealsWithDates = parsedMeals.map(meal => ({
          ...meal,
          timestamp: new Date(meal.timestamp)
        }));
        setMeals(mealsWithDates);
      }
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  }, []);

  // Save meals to localStorage
  const saveMeals = (updatedMeals) => {
    try {
      localStorage.setItem('meals', JSON.stringify(updatedMeals));
    } catch (error) {
      console.error('Error saving meals:', error);
    }
  };

  // Calculate daily totals
  const dailyTotals = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fats: acc.fats + meal.fats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  // Show feedback message
  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Call Netlify Function for AI analysis (SECURE!)
  const analyzeWithAI = async (prompt, imageData = null) => {
    try {
      const messages = [{
        role: 'user',
        content: []
      }];

      // Add image if provided
      if (imageData) {
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: `data:${imageData.type};base64,${imageData.data}`
          }
        });
      }

      // Add text prompt
      messages[0].content.push({
        type: 'text',
        text: prompt
      });

      // Call Netlify Function (not OpenRouter directly - this is secure!)
      const response = await fetch('/.netlify/functions/analyze-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          model: 'google/gemini-flash-1.5-8b' // FREE model!
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const data = await response.json();
      const text = data.choices[0].message.content;
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Could not parse AI response');
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw error;
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);

    try {
      // Convert image to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const imageData = {
        type: file.type,
        data: base64
      };

      const prompt = 'Analyze this food image and provide nutritional information. Return ONLY a JSON object with this exact structure: {"name": "food name", "calories": number, "protein": number, "carbs": number, "fats": number}. Estimate realistic values based on visible portion size.';

      const nutritionData = await analyzeWithAI(prompt, imageData);

      const newMeal = {
        id: Date.now(),
        ...nutritionData,
        timestamp: new Date(),
        type: 'photo'
      };

      const updatedMeals = [newMeal, ...meals];
      setMeals(updatedMeals);
      saveMeals(updatedMeals);
      showFeedback(`Added ${nutritionData.name} to your log!`, 'success');
    } catch (error) {
      console.error('Error analyzing photo:', error);
      showFeedback('Failed to analyze image. Please try again.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle manual entry
  const handleManualEntry = async () => {
    if (!manualEntry.trim()) return;

    setIsAnalyzing(true);

    try {
      const prompt = `Analyze this food description and provide nutritional information: "${manualEntry}". Return ONLY a JSON object with this exact structure: {"name": "food name", "calories": number, "protein": number, "carbs": number, "fats": number}. Estimate realistic values based on typical portions.`;

      const nutritionData = await analyzeWithAI(prompt);

      const newMeal = {
        id: Date.now(),
        ...nutritionData,
        timestamp: new Date(),
        type: 'manual'
      };

      const updatedMeals = [newMeal, ...meals];
      setMeals(updatedMeals);
      saveMeals(updatedMeals);
      showFeedback(`Added ${nutritionData.name} to your log!`, 'success');
      setManualEntry('');
    } catch (error) {
      console.error('Error analyzing text:', error);
      showFeedback('Failed to analyze food. Please try again.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete meal
  const deleteMeal = (id) => {
    const updatedMeals = meals.filter(meal => meal.id !== id);
    setMeals(updatedMeals);
    saveMeals(updatedMeals);
    showFeedback('Meal removed from log', 'info');
  };

  // Progress Bar Component
  const ProgressBar = ({ label, current, goal, color }) => {
    const percentage = Math.min((current / goal) * 100, 100);
    const remaining = Math.max(goal - current, 0);

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-200">{label}</span>
          <span className="text-sm text-gray-400">
            {Math.round(current)} / {goal} {label === 'Calories' ? 'kcal' : 'g'}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {remaining > 0 ? `${Math.round(remaining)} remaining` : 'Goal reached! 🎉'}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">FoodTrack AI</h1>
          <p className="text-gray-400">Track your nutrition goals with secure AI analysis</p>
          <div className="flex items-center gap-2 mt-2">
            <Shield className="w-4 h-4 text-green-400" />
            <p className="text-sm text-green-400">Secure - API key hidden on server</p>
            <span className="text-gray-500">•</span>
            <p className="text-sm text-gray-500">Powered by Google Gemini (FREE)</p>
          </div>
        </div>
      </div>

      {/* Feedback Notification */}
      {feedback && (
        <div className={`fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-green-600' :
          feedback.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          <Check className="w-5 h-5" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-8">
            {['log', 'history', 'goals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab === 'log' ? 'Log Meal' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'log' && (
          <div className="space-y-6">
            {/* AI Info */}
            <div className="bg-blue-900 border border-blue-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-200 font-medium mb-1">
                    <strong>Secure AI Analysis</strong>
                  </p>
                  <p className="text-sm text-blue-300">
                    Your API key is safely stored on Netlify's servers - not in your browser! 
                    Using free Google Gemini model for accurate food analysis.
                  </p>
                </div>
              </div>
            </div>

            {/* Photo Analysis Section */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold">Photo Analysis</h2>
              </div>
              <p className="text-gray-400 mb-4">Upload a photo for AI-powered nutritional analysis</p>
              
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isAnalyzing}
                />
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-400">Analyzing with AI...</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                      <span className="text-gray-400">Click to upload food photo</span>
                      <span className="text-xs text-gray-500 block mt-2">Gemini AI will analyze nutritional content</span>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Manual Entry Section */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Utensils className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-semibold">Manual Entry</h2>
              </div>
              <p className="text-gray-400 mb-4">Describe your meal for AI analysis</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Meal Description</label>
                  <input
                    type="text"
                    value={manualEntry}
                    onChange={(e) => setManualEntry(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
                    placeholder="e.g., Grilled chicken breast with steamed broccoli and brown rice"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    disabled={isAnalyzing}
                  />
                </div>
                <button
                  onClick={handleManualEntry}
                  disabled={!manualEntry.trim() || isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Analyze with AI
                </button>
              </div>
            </div>

            {/* Today's Meals */}
            {meals.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Today's Meals</h2>
                <div className="space-y-3">
                  {meals.map((meal) => (
                    <div key={meal.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{meal.name}</h3>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>{meal.calories} cal</span>
                          <span>{meal.protein}g protein</span>
                          <span>{meal.carbs}g carbs</span>
                          <span>{meal.fats}g fats</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMeal(meal.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold">Nutrition History</h2>
            </div>
            
            {meals.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Utensils className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No meals logged yet. Start tracking your nutrition!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meals.map((meal) => (
                  <div key={meal.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{meal.name}</h3>
                      <span className="text-xs text-gray-400">
                        {meal.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400">Calories</div>
                        <div className="font-medium">{meal.calories}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Protein</div>
                        <div className="font-medium">{meal.protein}g</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Carbs</div>
                        <div className="font-medium">{meal.carbs}g</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Fats</div>
                        <div className="font-medium">{meal.fats}g</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-orange-400" />
              <h2 className="text-xl font-semibold">Daily Goals</h2>
            </div>
            
            <ProgressBar
              label="Calories"
              current={dailyTotals.calories}
              goal={dailyGoals.calories}
              color="bg-gradient-to-r from-orange-500 to-red-500"
            />
            <ProgressBar
              label="Protein"
              current={dailyTotals.protein}
              goal={dailyGoals.protein}
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <ProgressBar
              label="Carbs"
              current={dailyTotals.carbs}
              goal={dailyGoals.carbs}
              color="bg-gradient-to-r from-green-500 to-emerald-500"
            />
            <ProgressBar
              label="Fats"
              current={dailyTotals.fats}
              goal={dailyGoals.fats}
              color="bg-gradient-to-r from-yellow-500 to-amber-500"
            />

            <div className="mt-8 p-4 bg-gray-700 rounded-lg">
              <h3 className="font-medium mb-2">Daily Summary</h3>
              <p className="text-sm text-gray-400">
                You've consumed {Math.round((dailyTotals.calories / dailyGoals.calories) * 100)}% 
                of your daily calorie goal. Keep it up!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodLoggerApp;
