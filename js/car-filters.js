/**
 * Car Filters
 * Handles filter logic and state management
 */

/**
 * Extract unique filter values from cars
 * @param {Array<Object>} cars - Array of car objects
 * @returns {Object} Filter options
 */
export function initializeFilters(cars) {
  const locations = [...new Set(cars.map(c => c.location).filter(Boolean))].sort();
  const fuelTypes = [...new Set(cars.map(c => c.fuelType).filter(Boolean))].sort();

  const prices = cars.map(c => c.price).filter(p => p > 0);
  const priceRange = {
    min: prices.length > 0 ? Math.min(...prices) : 0,
    max: prices.length > 0 ? Math.max(...prices) : 0
  };

  const years = cars.map(c => c.year).filter(y => y > 0);
  const yearRange = {
    min: years.length > 0 ? Math.min(...years) : 0,
    max: years.length > 0 ? Math.max(...years) : 0
  };

  // Create price buckets
  const priceBuckets = [
    { label: 'Under kr 100 000', min: 0, max: 100000 },
    { label: 'kr 100 000 - kr 200 000', min: 100000, max: 200000 },
    { label: 'kr 200 000 - kr 300 000', min: 200000, max: 300000 },
    { label: 'kr 300 000 - kr 500 000', min: 300000, max: 500000 },
    { label: 'Over kr 500 000', min: 500000, max: Infinity }
  ];

  // Create year buckets
  const currentYear = new Date().getFullYear();
  const yearBuckets = [
    { label: currentYear.toString(), min: currentYear, max: currentYear },
    { label: (currentYear - 1).toString(), min: currentYear - 1, max: currentYear - 1 },
    { label: `${currentYear - 3} - ${currentYear - 2}`, min: currentYear - 3, max: currentYear - 2 },
    { label: `${currentYear - 5} - ${currentYear - 4}`, min: currentYear - 5, max: currentYear - 4 },
    { label: `Eldre enn ${currentYear - 5}`, min: 0, max: currentYear - 6 }
  ];

  return {
    locations,
    fuelTypes,
    priceRange,
    yearRange,
    priceBuckets,
    yearBuckets
  };
}

/**
 * Apply filters to cars array
 * @param {Array<Object>} cars - Array of car objects
 * @param {Object} filterState - Current filter state
 * @returns {Array<Object>} Filtered cars
 */
export function applyFilters(cars, filterState) {
  return cars.filter(car => {
    // Location filter
    if (filterState.locations && filterState.locations.length > 0) {
      if (!filterState.locations.includes(car.location)) {
        return false;
      }
    }

    // Fuel type filter
    if (filterState.fuelTypes && filterState.fuelTypes.length > 0) {
      if (!filterState.fuelTypes.includes(car.fuelType)) {
        return false;
      }
    }

    // Price filter
    if (filterState.priceMin !== null && car.price < filterState.priceMin) {
      return false;
    }
    if (filterState.priceMax !== null && car.price > filterState.priceMax) {
      return false;
    }

    // Year filter
    if (filterState.yearMin !== null && car.year < filterState.yearMin) {
      return false;
    }
    if (filterState.yearMax !== null && car.year > filterState.yearMax) {
      return false;
    }

    return true;
  });
}

/**
 * Parse URL parameters to filter state
 * @returns {Object} Filter state from URL
 */
export function parseUrlFilters() {
  const params = new URLSearchParams(window.location.search);

  return {
    locations: params.get('location') ? params.get('location').split(',') : [],
    fuelTypes: params.get('fuel') ? params.get('fuel').split(',') : [],
    priceMin: params.get('priceMin') ? parseInt(params.get('priceMin'), 10) : null,
    priceMax: params.get('priceMax') ? parseInt(params.get('priceMax'), 10) : null,
    yearMin: params.get('yearMin') ? parseInt(params.get('yearMin'), 10) : null,
    yearMax: params.get('yearMax') ? parseInt(params.get('yearMax'), 10) : null,
    search: params.get('search') || '',
    sort: params.get('sort') || 'price-asc',
    page: params.get('page') ? parseInt(params.get('page'), 10) : 1
  };
}

/**
 * Update URL with current filter state
 * @param {Object} filterState - Current filter state
 */
export function updateUrlFilters(filterState) {
  const params = new URLSearchParams();

  if (filterState.locations && filterState.locations.length > 0) {
    params.set('location', filterState.locations.join(','));
  }

  if (filterState.fuelTypes && filterState.fuelTypes.length > 0) {
    params.set('fuel', filterState.fuelTypes.join(','));
  }

  if (filterState.priceMin !== null) {
    params.set('priceMin', filterState.priceMin.toString());
  }

  if (filterState.priceMax !== null && filterState.priceMax !== Infinity) {
    params.set('priceMax', filterState.priceMax.toString());
  }

  if (filterState.yearMin !== null) {
    params.set('yearMin', filterState.yearMin.toString());
  }

  if (filterState.yearMax !== null) {
    params.set('yearMax', filterState.yearMax.toString());
  }

  if (filterState.search) {
    params.set('search', filterState.search);
  }

  if (filterState.sort && filterState.sort !== 'price-asc') {
    params.set('sort', filterState.sort);
  }

  if (filterState.page && filterState.page > 1) {
    params.set('page', filterState.page.toString());
  }

  const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Check if any filters are active
 * @param {Object} filterState - Current filter state
 * @returns {boolean} True if any filters are active
 */
export function hasActiveFilters(filterState) {
  return (
    (filterState.locations && filterState.locations.length > 0) ||
    (filterState.fuelTypes && filterState.fuelTypes.length > 0) ||
    filterState.priceMin !== null ||
    filterState.priceMax !== null ||
    filterState.yearMin !== null ||
    filterState.yearMax !== null ||
    (filterState.search && filterState.search.trim() !== '')
  );
}

/**
 * Clear all filters
 * @returns {Object} Empty filter state
 */
export function clearAllFilters() {
  return {
    locations: [],
    fuelTypes: [],
    priceMin: null,
    priceMax: null,
    yearMin: null,
    yearMax: null,
    search: '',
    sort: 'price-asc',
    page: 1
  };
}
