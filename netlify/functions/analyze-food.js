// Netlify Function - Secure API Proxy
// This keeps your API key secret on the server side!

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get API key from environment variable (set in Netlify dashboard)
  const API_KEY = process.env.OPENROUTER_API_KEY;
  
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    // Parse the request body
    const { messages, model } = JSON.parse(event.body);

    // Default to Gemini Flash if no model specified
    const selectedModel = model || 'google/gemini-flash-1.5-8b';

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.URL || 'https://foodtrack-ai.netlify.app',
        'X-Title': 'FoodTrack AI'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'AI analysis failed',
          details: errorText 
        })
      };
    }

    const data = await response.json();

    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
