// postprocess.js
// Convert model text output into { animals_saved, comment, details }
// With specific animal impact calculations per ingredient

// Animal impact factors per ingredient (animals saved per year if avoiding)
const ANIMAL_IMPACTS = {
  // Dairy products (fraction of a cow's life per year)
  milk: { animal: 'cow', count: 0.1 },
  butter: { animal: 'cow', count: 0.05 },
  cheese: { animal: 'cow', count: 0.15 },
  cream: { animal: 'cow', count: 0.05 },
  yogurt: { animal: 'cow', count: 0.05 },
  whey: { animal: 'cow', count: 0.02 },

  // Eggs (chickens per year based on laying frequency)
  egg: { animal: 'chicken', count: 0.07 },
  eggs: { animal: 'chicken', count: 0.07 },

  // Meat products (animals per year assuming regular consumption)
  chicken: { animal: 'chicken', count: 1 },
  beef: { animal: 'cow', count: 0.5 },
  pork: { animal: 'pig', count: 0.5 },
  fish: { animal: 'fish', count: 12 },
  shrimp: { animal: 'shrimp', count: 50 },
  anchovy: { animal: 'fish', count: 20 },
  meat: { animal: 'various', count: 0.5 }, // generic meat assumption
  bacon: { animal: 'pig', count: 0.2 },

  // Other animal products
  honey: { animal: 'bee colony', count: 0.1 },
  gelatin: { animal: 'various', count: 0.1 },
  lard: { animal: 'pig', count: 0.1 }
};

export function processModelOutput(text) {
  if (!text || typeof text !== 'string') {
    return {
      animals_saved: 0,
      comment: 'Empty model output',
      details: []
    };
  }

  // Convert text to lowercase once for all comparisons
  const lower = text.toLowerCase();
  const found = [];
  
  // Detect ingredients and calculate impacts
  for (const [ingredient, impact] of Object.entries(ANIMAL_IMPACTS)) {
    if (lower.includes(ingredient)) {
      found.push({
        ingredient,
        ...impact
      });
    }
  }

  if (found.length > 0) {
    // Calculate total animals saved (if these ingredients were avoided)
    const impactsByAnimal = {};
    let totalSaved = 0;
    
    for (const { ingredient, animal, count } of found) {
      if (!impactsByAnimal[animal]) {
        impactsByAnimal[animal] = { total: 0, ingredients: [] };
      }
      impactsByAnimal[animal].total += count;
      impactsByAnimal[animal].ingredients.push(ingredient);
      totalSaved += count;
    }

    // Format detailed comment
    const animalDetails = Object.entries(impactsByAnimal)
      .map(([animal, { total, ingredients }]) => (
        `${total.toFixed(2)} ${animal}${total !== 1 ? 's' : ''} (from ${ingredients.join(', ')})`
      ));

    const comment = `Recipe contains animal products. If made vegan, you could save approximately ${animalDetails.join(' and ')} per year.`;
    
    return {
      animals_saved: 0, // Current recipe saves 0 since it contains animal products
      potential_yearly_impact: totalSaved.toFixed(2), // How many animals could be saved if veganized
      comment,
      details: found.map(f => ({
        ingredient: f.ingredient,
        animal: f.animal,
        yearly_impact: f.count.toFixed(2)
      }))
    };
  }

  // If no animal products detected, analyze what this recipe might traditionally contain
  const veganImpacts = [];
  
  // Common recipe patterns to detect what animals are being saved
  const recipePatterns = {
    // Protein-focused dishes
    chickenDishes: ['chicken', 'poultry', 'wings', 'nugget', 'drumstick'],
    beefDishes: ['beef', 'steak', 'burger', 'meatball'],
    fishDishes: ['fish', 'seafood', 'tuna', 'salmon', 'fillet'],
    porkDishes: ['pork', 'ham', 'bacon'],
    
    // Dairy-heavy dishes
    dairyDishes: ['cream', 'cheese', 'milk', 'butter', 'dairy'],
    
    // Egg-focused dishes
    eggDishes: ['egg', 'omelette', 'quiche', 'frittata']
  };

  // Check for protein substitutions (tofu, seitan, tempeh, etc.)
  const proteinSubstitutes = ['tofu', 'seitan', 'tempeh', 'plant-based', 'meat alternative', 'vegan meat', 'vegan chicken', 'vegan beef', 'vegan fish', 'plant-based meat', 'plant-based minced meat'];
  const hasProteinSub = proteinSubstitutes.some(sub => lower.includes(sub));

  // Check for dairy substitutions
  const dairySubstitutes = ['plant milk', 'almond milk', 'soy milk', 'oat milk', 'vegan cheese', 'nutritional yeast', 'plant-based cream'];
  const hasDairySub = dairySubstitutes.some(sub => lower.includes(sub));

  // Check for egg substitutions
  const eggSubstitutes = ['flax egg', 'chia egg', 'just egg', 'vegan egg', 'egg replacer'];
  const hasEggSub = eggSubstitutes.some(sub => lower.includes(sub));

  // Analyze recipe context and add appropriate impacts
  if (hasProteinSub) {
    if (recipePatterns.chickenDishes.some(term => lower.includes(term))) {
      veganImpacts.push({ animal: 'chicken', yearly_impact: 1.0, ingredient: 'chicken alternative' });
    }
    if (recipePatterns.beefDishes.some(term => lower.includes(term))) {
      veganImpacts.push({ animal: 'cow', yearly_impact: 0.5, ingredient: 'beef alternative' });
    }
    if (recipePatterns.fishDishes.some(term => lower.includes(term))) {
      veganImpacts.push({ animal: 'fish', yearly_impact: 12.0, ingredient: 'fish alternative' });
    }
    if (recipePatterns.porkDishes.some(term => lower.includes(term))) {
      veganImpacts.push({ animal: 'pig', yearly_impact: 0.5, ingredient: 'pork alternative' });
    }
  }

  if (hasDairySub && recipePatterns.dairyDishes.some(term => lower.includes(term))) {
    veganImpacts.push({ animal: 'cow', yearly_impact: 0.25, ingredient: 'dairy alternative' });
  }

  if (hasEggSub && recipePatterns.eggDishes.some(term => lower.includes(term))) {
    veganImpacts.push({ animal: 'chicken', yearly_impact: 0.2, ingredient: 'egg alternative' });
  }

  // If no specific substitutions found but recipe contains protein substitute words,
  // assume it's replacing a common meat (chicken or beef)
  if (veganImpacts.length === 0 && hasProteinSub) {
    veganImpacts.push({ animal: 'chicken', yearly_impact: 0.5, ingredient: 'meat alternative' });
  }

  return {
    animals_saved: veganImpacts.length > 0 ? 1 : 0,
    potential_yearly_impact: veganImpacts.reduce((sum, impact) => sum + parseFloat(impact.yearly_impact), 0),
    comment: veganImpacts.length > 0 
      ? `Recipe uses vegan alternatives that help save animals! 🌱` 
      : 'Naturally vegan recipe! No animal alternatives needed.',
    details: veganImpacts
  };
}
