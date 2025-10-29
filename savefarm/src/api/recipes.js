// TheMealDB API integration for vegan recipes

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Get random vegan meal
export async function getRandomVeganMeal() {
  try {
    // Get meals from all vegan-friendly categories
    const allMeals = await getVeganMeals();
    
    if (allMeals && allMeals.length > 0) {
      // Pick a random meal
      const randomMeal = allMeals[Math.floor(Math.random() * allMeals.length)];
      
      // Get full details for this meal
      const detailResponse = await fetch(`${BASE_URL}/lookup.php?i=${randomMeal.idMeal}`);
      const detailData = await detailResponse.json();
      
      return detailData.meals ? detailData.meals[0] : null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching random vegan meal:', error);
    return null;
  }
}

// Get all vegan meals (combining multiple sources)
export async function getVeganMeals() {
  try {
    const allMeals = [];
    
    // Get from Vegan category
    const veganResponse = await fetch(`${BASE_URL}/filter.php?c=Vegan`);
    const veganData = await veganResponse.json();
    if (veganData.meals) {
      allMeals.push(...veganData.meals);
    }
    
    // Get from Vegetarian category (many are also vegan)
    const vegResponse = await fetch(`${BASE_URL}/filter.php?c=Vegetarian`);
    const vegData = await vegResponse.json();
    if (vegData.meals) {
      allMeals.push(...vegData.meals);
    }
    
    // Get some starter meals
    const starterResponse = await fetch(`${BASE_URL}/filter.php?c=Starter`);
    const starterData = await starterResponse.json();
    if (starterData.meals) {
      allMeals.push(...starterData.meals);
    }
    
    // Get breakfast meals
    const breakfastResponse = await fetch(`${BASE_URL}/filter.php?c=Breakfast`);
    const breakfastData = await breakfastResponse.json();
    if (breakfastData.meals) {
      allMeals.push(...breakfastData.meals);
    }
    
    // Remove duplicates by idMeal
    const uniqueMeals = Array.from(
      new Map(allMeals.map(meal => [meal.idMeal, meal])).values()
    );
    
    return uniqueMeals;
  } catch (error) {
    console.error('Error fetching vegan meals:', error);
    return [];
  }
}

// Get meal details by ID
export async function getMealById(id) {
  try {
    const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    const data = await response.json();
    return data.meals ? data.meals[0] : null;
  } catch (error) {
    console.error('Error fetching meal details:', error);
    return null;
  }
}

// Search meals by name
export async function searchMeals(query) {
  try {
    const response = await fetch(`${BASE_URL}/search.php?s=${query}`);
    const data = await response.json();
    
    // Return all meals (not just filtering for vegan, since user might search for anything)
    // They can analyze any recipe to see if it's vegan or what the impact would be
    return data.meals || [];
  } catch (error) {
    console.error('Error searching meals:', error);
    return [];
  }
}

// Format meal for recipe analyzer
export function formatMealForAnalyzer(meal) {
  if (!meal) return '';
  
  let recipe = `${meal.strMeal}\n\n`;
  recipe += `Category: ${meal.strCategory}\n`;
  recipe += `Area: ${meal.strArea}\n\n`;
  recipe += `Ingredients:\n`;
  
  // TheMealDB stores ingredients as strIngredient1, strIngredient2, etc.
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      recipe += `- ${measure} ${ingredient}\n`;
    }
  }
  
  recipe += `\nInstructions:\n${meal.strInstructions}`;
  
  return recipe;
}
