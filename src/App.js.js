// src/App.js
import React, { useState, useEffect } from 'react';
import { Camera, Utensils, TrendingUp, Target, Plus, X, Check, Shield } from 'lucide-react';

const DEFAULT_MODEL = 'google/gemini-1.5-flash'; // <- frontend default model (Gemini)

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
      const saved = localStorage.getItem('meals');
      if (saved) {
        const parsed = JSON.parse(saved);
        setMeals(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
    } catch (e) {
      console.error('Error loading meals:', e);
    }
  }, []);

  const saveMeals = (updated) => {
    try {
      localStorage.setItem('meals', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving meals:', e);
    }
  };

  const dailyTotals = meals.reduce((acc, meal) => ({
    calories: acc.calories + (Number(meal.calories) || 0),
    protein: acc.protein + (Number(meal.protein) || 0),
    carbs: acc.carbs + (Number(meal.carbs) || 0),
    fats: acc.fats + (Number(meal.fats) || 0)
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Core analyze function - calls your Netlify function
  const analyzeWithAI = async (prompt, imageData = null) => {
    try {
      const messages = [{
        role: 'user',
        content: []
      }];

      if (imageData) {
        messages[0].content.push({
          type: 'image_url',
          image_url: { url: `data:${imageData.type};base64,${imageData.data}` }
        });
      }

      messages[0].content.push({ type: 'text', text: prompt });

      const functionUrl = `${window.location.origin}/.netlify/functions/analyze-food`;
      console.debug('Calling function:', functionUrl);

      const resp = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ model: DEFAULT_MODEL, messages })
      });

      const raw = await resp.text();
      console.debug('Function status:', resp.status);
      console.debug('Function raw response:', raw);

      if (!resp.ok) {
        // try parse helpful error
        let parsedError = null;
        try { parsedError = JSON.parse(raw); } catch (e) { parsedError = { message: raw }; }
        const msg = parsedError?.error?.message || parsedError?.message || `Function failed (${resp.status})`;
        throw new Error(msg);
      }

      // parse top-level JSON if possible
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }

      // typical openrouter/openai style: { choices: [ { message: { content: ... } } ] }
      let text = null;
      if (parsed && Array.isArray(parsed.choices) && parsed.choices.length > 0) {
        const choice = parsed.choices[0];
        if (choice.message && typeof choice.message.content === 'string') {
          text = choice.message.content;
        } else if (choice.text) {
          text = choice.text;
        } else if (choice.message && Array.isArray(choice.message.content)) {
          text = choice.message.content.map(p => (typeof p === 'string' ? p : p.text || '')).join(' ');
        } else {
          text = JSON.stringify(choice.message?.content || choice);
        }
      } else if (!parsed) {
        text = raw;
      } else {
        // If parsed is already the nutrition object
        if (parsed && parsed.name && parsed.calories != null) return parsed;
        // fallback
        text = raw;
      }

      // extract first JSON object in the text
      const match = typeof text === 'string' ? text.match(/\{[\s\S]*\}/) : null;
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e) {
          console.warn('Failed parse matched JSON:', e);
          throw new Error('Could not parse AI JSON response.');
        }
      }

      // last attempt: parsed might already contain nutrition at top
      if (parsed && typeof parsed === 'object' && parsed.name && parsed.calories != null) return parsed;

      console.error('No nutrition JSON found. Raw response:', raw);
      throw new Error('Could not parse AI response');

    } catch (err) {
      console.error('AI Analysis Error:', err);
      throw err;
    }
  };

  // Photo upload handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });

      const imageData = { type: file.type, data: base64 };
      const prompt = 'Analyze this food image and provide nutritional information. Return ONLY a JSON object with this exact structure: {"name": "food name", "calories": number, "protein": number, "carbs": number, "fats": number}. Estimate realistic values based on visible portion size.';

      const nutritionData = await analyzeWithAI(prompt, imageData);

      const newMeal = { id: Date.now(), ...nutritionData, timestamp: new Date(), type: 'photo' };
      const updated = [newMeal, ...meals];
      setMeals(updated); saveMeals(updated);
      showFeedback(`Added ${nutritionData.name} to your log!`, 'success');
    } catch (err) {
      console.error('Error analyzing photo:', err);
      showFeedback('Failed to analyze image. Please check function logs and try again.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Manual entry
  const handleManualEntry = async () => {
    if (!manualEntry.trim()) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze this food description and provide nutritional information: "${manualEntry}". Return ONLY a JSON object with this exact structure: {"name":"food name","calories":number,"protein":number,"carbs":number,"fats":number}. Estimate realistic values based on typical portions.`;
      const nutritionData = await analyzeWithAI(prompt);
      const newMeal = { id: Date.now(), ...nutritionData, timestamp: new Date(), type: 'manual' };
      const updated = [newMeal, ...meals];
      setMeals(updated); saveMeals(updated);
      showFeedback(`Added ${nutritionData.name} to your log!`, 'success');
      setManualEntry('');
    } catch (err) {
      console.error('Error analyzing text:', err);
      showFeedback('Failed to analyze food. Please try again.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteMeal = (id) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated); saveMeals(updated);
    showFeedback('Meal removed from log', 'info');
  };

  const ProgressBar = ({ label, current, goal, color }) => {
    const percent = Math.min((current / goal) * 100, 100);
    const remaining = Math.max(goal - current, 0);
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-200">{label}</span>
          <span className="text-sm text-gray-400">{Math.round(current)} / {goal} {label === 'Calories' ? 'kcal' : 'g'}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div className={`h-full ${color} transition-all duration-500 ease-out rounded-full`} style={{ width: `${percent}%` }} />
        </div>
        <div className="text-xs text-gray-500 mt-1">{remaining > 0 ? `${Math.round(remaining)} remaining` : 'Goal reached! 🎉'}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">FoodTrack AI</h1>
          <p className="text-gray-400">Track your nutrition goals with secure AI analysis</p>
          <div className="flex items-center gap-2 mt-2">
            <Shield className="w-4 h-4 text-green-400" />
            <p className="text-sm text-green-400">Secure - API key hidden on server</p>
            <span className="text-gray-500">•</span>
            <p className="text-sm text-gray-500">Powered by Google Gemini (via OpenRouter)</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-green-600' : feedback.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
          <Check className="w-5 h-5" /><span>{feedback.message}</span>
        </div>
      )}

      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-8">
            {['log','history','goals'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-2 capitalize transition-colors ${activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}>
                {tab === 'log' ? 'Log Meal' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'log' && (
          <div className="space-y-6">
            <div className="bg-blue-900 border border-blue-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-200 font-medium mb-1"><strong>Secure AI Analysis</strong></p>
                  <p className="text-sm text-blue-300">Your API key is safely stored on Netlify's servers - not in your browser. Using Google Gemini for food analysis.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold">Photo Analysis</h2>
              </div>
              <p className="text-gray-400 mb-4">Upload a photo for AI-powered nutritional analysis</p>

              <label className="block">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isAnalyzing} />
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

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Utensils className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-semibold">Manual Entry</h2>
              </div>
              <p className="text-gray-400 mb-4">Describe your meal for AI analysis</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Meal Description</label>
                  <input type="text" value={manualEntry} onChange={(e) => setManualEntry(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()} placeholder="e.g., Grilled chicken breast with steamed broccoli and brown rice" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" disabled={isAnalyzing} />
                </div>
                <button onClick={handleManualEntry} disabled={!manualEntry.trim() || isAnalyzing} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Analyze with AI
                </button>
              </div>
            </div>

            {meals.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Today's Meals</h2>
                <div className="space-y-3">
                  {meals.map(meal => (
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
                      <button onClick={() => deleteMeal(meal.id)} className="text-gray-400 hover:text-red-400 transition-colors"><X className="w-5 h-5" /></button>
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
                {meals.map(meal => (
                  <div key={meal.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{meal.name}</h3>
                      <span className="text-xs text-gray-400">{meal.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div><div className="text-gray-400">Calories</div><div className="font-medium">{meal.calories}</div></div>
                      <div><div className="text-gray-400">Protein</div><div className="font-medium">{meal.protein}g</div></div>
                      <div><div className="text-gray-400">Carbs</div><div className="font-medium">{meal.carbs}g</div></div>
                      <div><div className="text-gray-400">Fats</div><div className="font-medium">{meal.fats}g</div></div>
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

            <ProgressBar label="Calories" current={dailyTotals.calories} goal={dailyGoals.calories} color="bg-gradient-to-r from-orange-500 to-red-500" />
            <ProgressBar label="Protein" current={dailyTotals.protein} goal={dailyGoals.protein} color="bg-gradient-to-r from-blue-500 to-cyan-500" />
            <ProgressBar label="Carbs" current={dailyTotals.carbs} goal={dailyGoals.carbs} color="bg-gradient-to-r from-green-500 to-emerald-500" />
            <ProgressBar label="Fats" current={dailyTotals.fats} goal={dailyGoals.fats} color="bg-gradient-to-r from-yellow-500 to-amber-500" />

            <div className="mt-8 p-4 bg-gray-700 rounded-lg">
              <h3 className="font-medium mb-2">Daily Summary</h3>
              <p className="text-sm text-gray-400">You've consumed {Math.round((dailyTotals.calories / dailyGoals.calories) * 100)}% of your daily calorie goal. Keep it up!</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FoodLoggerApp;