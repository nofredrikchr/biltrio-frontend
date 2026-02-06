/**
 * Car Search
 * Implements fuzzy search functionality
 */

/**
 * Normalize string for search (lowercase, remove accents)
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Check if text matches search query
 * @param {string} text - Text to search in
 * @param {string} query - Search query
 * @returns {boolean} True if text contains query
 */
function matchesQuery(text, query) {
  const normalizedText = normalizeString(text);
  const normalizedQuery = normalizeString(query);
  return normalizedText.includes(normalizedQuery);
}

/**
 * Search cars by query
 * @param {Array<Object>} cars - Array of car objects
 * @param {string} query - Search query
 * @returns {Array<Object>} Filtered cars
 */
export function searchCars(cars, query) {
  if (!query || query.trim() === '') {
    return cars;
  }

  const trimmedQuery = query.trim();

  return cars.filter(car => {
    // Search in make and model
    if (matchesQuery(car.make, trimmedQuery)) return true;
    if (matchesQuery(car.model, trimmedQuery)) return true;
    if (matchesQuery(`${car.make} ${car.model}`, trimmedQuery)) return true;

    // Search in equipment
    if (car.equipment && car.equipment.length > 0) {
      if (car.equipment.some(item => matchesQuery(item, trimmedQuery))) {
        return true;
      }
    }

    // Search in description
    if (matchesQuery(car.description, trimmedQuery)) return true;

    // Search in other fields
    if (matchesQuery(car.type, trimmedQuery)) return true;
    if (matchesQuery(car.fuelType, trimmedQuery)) return true;
    if (matchesQuery(car.transmission, trimmedQuery)) return true;
    if (matchesQuery(car.color, trimmedQuery)) return true;

    return false;
  });
}

/**
 * Create debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
