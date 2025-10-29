// analyze.js
// Single-model inference helper. Reads model and token from environment.
import { processModelOutput } from './postprocess.js';

export async function analyzeRecipe(recipeText) {
  const model = import.meta.env.VITE_HF_MODEL || 'sshleifer/tiny-gpt2';
  const hfToken = import.meta.env.VITE_HF_TOKEN;
  const fallbackModels = [
    'facebook/bart-large-cnn',
    'google/flan-t5-small',
    'distilgpt2',
    'sshleifer/tiny-gpt2'
  ];
  if (!hfToken || !hfToken.startsWith('hf_')) {
    console.error('Missing or invalid Hugging Face token:', hfToken);
    return {
      animals_saved: 0,
      comment: 'Missing or invalid Hugging Face token. Please set VITE_HF_TOKEN in .env and restart the dev server.'
    };
  }

  const prompt = `Analyze this recipe and determine if it's vegan. Return JSON with animals_saved and comment.\nRecipe: ${recipeText}`;

  // helper to call a specific model endpoint
  async function callModel(modelId) {
    const API_URL = `https://api-inference.huggingface.co/models/${modelId}`;
    console.log('Calling HF inference:', API_URL);
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });
    return resp;
  }

  try {
    // try primary model first
    let response = await callModel(model);

    // if primary model not found, try fallbacks
    if (response.status === 404) {
      console.warn(`Model ${model} not available via inference API, trying fallbacks`);
      for (const fb of fallbackModels) {
        response = await callModel(fb);
        if (response.ok) {
          break;
        }
        if (response.status !== 404) {
          // non-404 error from a fallback — stop and return that error
          const text = await response.text();
          console.error('API Response:', { model: fb, status: response.status, text });
          return { animals_saved: 0, comment: `API error: ${response.status} - ${text}` };
        }
      }
    }

    if (!response.ok) {
      const text = await response.text();
      console.error('API Response:', { model, status: response.status, statusText: response.statusText, text });
      return { animals_saved: 0, comment: `API error: ${response.status} - ${text}` };
    }

    const result = await response.json();

    // Normalize different model response shapes into text
    let rawText = null;
    if (Array.isArray(result) && result[0]?.generated_text) rawText = result[0].generated_text;
    else if (result?.summary_text) rawText = result.summary_text;
    else if (typeof result === 'string') rawText = result;
    else if (result && typeof result === 'object') {
      // if object and already has animals_saved/comment, return it
      if ('animals_saved' in result && 'comment' in result) return result;
      // otherwise try to stringify object to text
      rawText = JSON.stringify(result);
    }

    if (rawText) {
      // let postprocessor decide and return structured JSON
      return processModelOutput(rawText.trim());
    }

    return { animals_saved: 0, comment: 'No valid AI output' };
  } catch (err) {
    console.error('AI Error:', err);
    return { animals_saved: 0, comment: `AI error: ${err.message}` };
  }
}
