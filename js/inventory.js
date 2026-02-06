/**
 * Inventory Page Main Script
 * Coordinates filters, search, sorting, and pagination
 */

import { getAllCars } from './car-data.js';
import { renderCarCards, renderLoadingSkeleton } from './car-cards.js';
import {
  initializeFilters,
  applyFilters,
  parseUrlFilters,
  updateUrlFilters,
  hasActiveFilters,
  clearAllFilters
} from './car-filters.js';
import { searchCars, debounce } from './car-search.js';
import { paginateCars, renderPagination, scrollToTop } from './car-pagination.js';

// State
let allCars = [];
let filteredCars = [];
let filterOptions = {};
let filterState = parseUrlFilters();

// DOM elements
const inventoryGrid = document.getElementById('inventoryGrid');
const resultCount = document.getElementById('resultCount');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const paginationContainer = document.getElementById('pagination');
const activeFiltersContainer = document.getElementById('activeFilters');
const errorMessage = document.getElementById('errorMessage');
const noResults = document.getElementById('noResults');
const retryButton = document.getElementById('retryButton');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// Filter dropdown elements
const locationFilterBtn = document.getElementById('locationFilterBtn');
const locationFilterMenu = document.getElementById('locationFilterMenu');
const fuelFilterBtn = document.getElementById('fuelFilterBtn');
const fuelFilterMenu = document.getElementById('fuelFilterMenu');
const priceFilterBtn = document.getElementById('priceFilterBtn');
const priceFilterMenu = document.getElementById('priceFilterMenu');
const yearFilterBtn = document.getElementById('yearFilterBtn');
const yearFilterMenu = document.getElementById('yearFilterMenu');

/**
 * Sort cars by selected criteria
 */
function sortCars(cars, sortBy) {
  const sorted = [...cars];

  switch (sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'year-desc':
      sorted.sort((a, b) => b.year - a.year);
      break;
    case 'year-asc':
      sorted.sort((a, b) => a.year - b.year);
      break;
    case 'mileage-asc':
      sorted.sort((a, b) => a.mileage - b.mileage);
      break;
    case 'mileage-desc':
      sorted.sort((a, b) => b.mileage - a.mileage);
      break;
    default:
      break;
  }

  return sorted;
}

/**
 * Render the car grid
 */
function renderGrid() {
  // Apply filters
  let results = applyFilters(allCars, filterState);

  // Apply search
  if (filterState.search) {
    results = searchCars(results, filterState.search);
  }

  // Sort
  results = sortCars(results, filterState.sort);

  filteredCars = results;

  // Update result count
  resultCount.textContent = results.length;

  // Paginate
  const paginated = paginateCars(results, filterState.page);

  // Render cars
  if (results.length === 0) {
    inventoryGrid.innerHTML = '';
    noResults.style.display = 'block';
    errorMessage.style.display = 'none';
    paginationContainer.innerHTML = '';
  } else {
    noResults.style.display = 'none';
    errorMessage.style.display = 'none';
    inventoryGrid.innerHTML = renderCarCards(paginated.cars);

    // Render pagination
    paginationContainer.innerHTML = renderPagination(paginated.currentPage, paginated.totalPages);

    // Add pagination click handlers
    paginationContainer.querySelectorAll('.pagination__button').forEach(button => {
      button.addEventListener('click', () => {
        const page = parseInt(button.dataset.page, 10);
        if (page) {
          filterState.page = page;
          updateUrlFilters(filterState);
          renderGrid();
          scrollToTop();
        }
      });
    });
  }

  // Render active filters
  renderActiveFilters();
}

/**
 * Render active filter chips
 */
function renderActiveFilters() {
  activeFiltersContainer.innerHTML = '';

  const hasFilters = hasActiveFilters(filterState);

  if (!hasFilters) return;

  // Location filters
  if (filterState.locations && filterState.locations.length > 0) {
    filterState.locations.forEach(location => {
      activeFiltersContainer.innerHTML += createFilterChip('Lokasjon', location, () => {
        filterState.locations = filterState.locations.filter(l => l !== location);
        filterState.page = 1;
        updateUrlFilters(filterState);
        renderGrid();
      });
    });
  }

  // Fuel type filters
  if (filterState.fuelTypes && filterState.fuelTypes.length > 0) {
    filterState.fuelTypes.forEach(fuel => {
      activeFiltersContainer.innerHTML += createFilterChip('Drivstoff', fuel, () => {
        filterState.fuelTypes = filterState.fuelTypes.filter(f => f !== fuel);
        filterState.page = 1;
        updateUrlFilters(filterState);
        renderGrid();
      });
    });
  }

  // Price filter
  if (filterState.priceMin !== null || filterState.priceMax !== null) {
    let label = 'Pris: ';
    if (filterState.priceMin !== null && filterState.priceMax !== null && filterState.priceMax !== Infinity) {
      label += `kr ${filterState.priceMin.toLocaleString('nb-NO')} - kr ${filterState.priceMax.toLocaleString('nb-NO')}`;
    } else if (filterState.priceMin !== null) {
      label += `Fra kr ${filterState.priceMin.toLocaleString('nb-NO')}`;
    } else if (filterState.priceMax !== null && filterState.priceMax !== Infinity) {
      label += `Til kr ${filterState.priceMax.toLocaleString('nb-NO')}`;
    }

    activeFiltersContainer.innerHTML += createFilterChip('', label, () => {
      filterState.priceMin = null;
      filterState.priceMax = null;
      filterState.page = 1;
      updateUrlFilters(filterState);
      renderGrid();
    });
  }

  // Year filter
  if (filterState.yearMin !== null || filterState.yearMax !== null) {
    let label = 'År: ';
    if (filterState.yearMin !== null && filterState.yearMax !== null) {
      label += `${filterState.yearMin} - ${filterState.yearMax}`;
    } else if (filterState.yearMin !== null) {
      label += `Fra ${filterState.yearMin}`;
    } else if (filterState.yearMax !== null) {
      label += `Til ${filterState.yearMax}`;
    }

    activeFiltersContainer.innerHTML += createFilterChip('', label, () => {
      filterState.yearMin = null;
      filterState.yearMax = null;
      filterState.page = 1;
      updateUrlFilters(filterState);
      renderGrid();
    });
  }

  // Search filter
  if (filterState.search) {
    activeFiltersContainer.innerHTML += createFilterChip('Søk', filterState.search, () => {
      filterState.search = '';
      searchInput.value = '';
      filterState.page = 1;
      updateUrlFilters(filterState);
      renderGrid();
    });
  }

  // Clear all button
  if (hasFilters) {
    activeFiltersContainer.innerHTML += `
      <button class="clear-all-filters" id="clearAllBtn">
        Nullstill alle
      </button>
    `;

    document.getElementById('clearAllBtn').addEventListener('click', handleClearAll);
  }
}

/**
 * Create filter chip HTML
 */
function createFilterChip(type, value, onRemove) {
  const chipId = `chip-${Math.random().toString(36).substr(2, 9)}`;
  const label = type ? `${type}: ${value}` : value;

  setTimeout(() => {
    const chip = document.getElementById(chipId);
    if (chip) {
      chip.querySelector('.filter-chip__remove').addEventListener('click', onRemove);
    }
  }, 0);

  return `
    <div class="filter-chip" id="${chipId}">
      <span>${label}</span>
      <button class="filter-chip__remove" aria-label="Fjern filter">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `;
}

/**
 * Initialize filter dropdowns
 */
function initializeFilterDropdowns() {
  // Location filter
  if (filterOptions.locations && filterOptions.locations.length > 0) {
    locationFilterMenu.innerHTML = filterOptions.locations.map(location => `
      <label class="filter-dropdown__item">
        <input type="checkbox" value="${location}" ${filterState.locations.includes(location) ? 'checked' : ''}>
        <span>${location}</span>
      </label>
    `).join('');

    locationFilterMenu.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const value = e.target.value;
        if (e.target.checked) {
          if (!filterState.locations.includes(value)) {
            filterState.locations.push(value);
          }
        } else {
          filterState.locations = filterState.locations.filter(l => l !== value);
        }
        filterState.page = 1;
        updateUrlFilters(filterState);
        renderGrid();
      });
    });
  }

  // Fuel type filter
  if (filterOptions.fuelTypes && filterOptions.fuelTypes.length > 0) {
    fuelFilterMenu.innerHTML = filterOptions.fuelTypes.map(fuel => `
      <label class="filter-dropdown__item">
        <input type="checkbox" value="${fuel}" ${filterState.fuelTypes.includes(fuel) ? 'checked' : ''}>
        <span>${fuel}</span>
      </label>
    `).join('');

    fuelFilterMenu.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const value = e.target.value;
        if (e.target.checked) {
          if (!filterState.fuelTypes.includes(value)) {
            filterState.fuelTypes.push(value);
          }
        } else {
          filterState.fuelTypes = filterState.fuelTypes.filter(f => f !== value);
        }
        filterState.page = 1;
        updateUrlFilters(filterState);
        renderGrid();
      });
    });
  }

  // Price filter
  if (filterOptions.priceBuckets) {
    priceFilterMenu.innerHTML = filterOptions.priceBuckets.map(bucket => {
      const isActive = filterState.priceMin === bucket.min && filterState.priceMax === bucket.max;
      return `
        <label class="filter-dropdown__item">
          <input type="radio" name="price" value="${bucket.min}-${bucket.max}" ${isActive ? 'checked' : ''}>
          <span>${bucket.label}</span>
        </label>
      `;
    }).join('');

    priceFilterMenu.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const [min, max] = e.target.value.split('-').map(v => v === 'Infinity' ? Infinity : parseInt(v, 10));
        filterState.priceMin = min;
        filterState.priceMax = max;
        filterState.page = 1;
        updateUrlFilters(filterState);
        renderGrid();
        closeAllDropdowns();
      });
    });
  }

  // Year filter
  if (filterOptions.yearBuckets) {
    yearFilterMenu.innerHTML = filterOptions.yearBuckets.map(bucket => {
      const isActive = filterState.yearMin === bucket.min && filterState.yearMax === bucket.max;
      return `
        <label class="filter-dropdown__item">
          <input type="radio" name="year" value="${bucket.min}-${bucket.max}" ${isActive ? 'checked' : ''}>
          <span>${bucket.label}</span>
        </label>
      `;
    }).join('');

    yearFilterMenu.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const [min, max] = e.target.value.split('-').map(v => parseInt(v, 10));
        filterState.yearMin = min;
        filterState.yearMax = max;
        filterState.page = 1;
        updateUrlFilters(filterState);
        renderGrid();
        closeAllDropdowns();
      });
    });
  }

  // Toggle dropdown visibility
  [locationFilterBtn, fuelFilterBtn, priceFilterBtn, yearFilterBtn].forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      const isActive = menu.classList.contains('active');

      closeAllDropdowns();

      if (!isActive) {
        menu.classList.add('active');
        btn.classList.add('active');
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    closeAllDropdowns();
  });

  // Prevent closing when clicking inside menu
  [locationFilterMenu, fuelFilterMenu, priceFilterMenu, yearFilterMenu].forEach(menu => {
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}

/**
 * Close all filter dropdowns
 */
function closeAllDropdowns() {
  [locationFilterMenu, fuelFilterMenu, priceFilterMenu, yearFilterMenu].forEach(menu => {
    menu.classList.remove('active');
  });
  [locationFilterBtn, fuelFilterBtn, priceFilterBtn, yearFilterBtn].forEach(btn => {
    btn.classList.remove('active');
  });
}

/**
 * Handle clear all filters
 */
function handleClearAll() {
  filterState = clearAllFilters();
  searchInput.value = '';
  sortSelect.value = 'price-asc';
  updateUrlFilters(filterState);
  renderGrid();
  initializeFilterDropdowns(); // Re-initialize to update checkboxes
}

/**
 * Show error state
 */
function showError() {
  inventoryGrid.innerHTML = '';
  errorMessage.style.display = 'block';
  noResults.style.display = 'none';
  paginationContainer.innerHTML = '';
  resultCount.textContent = '0';
}

/**
 * Initialize the inventory page
 */
async function initialize() {
  // Show loading state
  inventoryGrid.innerHTML = renderLoadingSkeleton(12);

  try {
    // Fetch cars
    allCars = await getAllCars();

    if (!allCars || allCars.length === 0) {
      showError();
      return;
    }

    // Initialize filters
    filterOptions = initializeFilters(allCars);
    initializeFilterDropdowns();

    // Set initial values from URL
    if (filterState.search) {
      searchInput.value = filterState.search;
    }
    if (filterState.sort) {
      sortSelect.value = filterState.sort;
    }

    // Render initial grid
    renderGrid();

    // Setup event listeners
    searchInput.addEventListener('input', debounce((e) => {
      filterState.search = e.target.value;
      filterState.page = 1;
      updateUrlFilters(filterState);
      renderGrid();
    }, 300));

    sortSelect.addEventListener('change', (e) => {
      filterState.sort = e.target.value;
      filterState.page = 1;
      updateUrlFilters(filterState);
      renderGrid();
    });

    clearFiltersBtn.addEventListener('click', handleClearAll);

  } catch (error) {
    console.error('Failed to load inventory:', error);
    showError();
  }
}

// Retry button handler
retryButton.addEventListener('click', () => {
  initialize();
});

// Initialize on load
initialize();
