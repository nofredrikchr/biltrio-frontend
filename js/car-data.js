/**
 * Car Data Management
 * Handles data normalization, caching, and provides interface for components
 */

import { fetchBillinkData, extractCarElement, getElementText, extractImages, extractEquipment } from './billink-api.js';

const CACHE_KEY = 'biltrio_cars_cache';
const CACHE_TIMESTAMP_KEY = 'biltrio_cars_cache_timestamp';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Parse Norwegian number format to integer
 * "139 000 kr" → 139000
 * "15 000" → 15000
 * @param {string} str - Norwegian formatted number
 * @returns {number} Parsed integer
 */
function parseNorwegianNumber(str) {
  if (!str) return 0;
  // Remove everything except digits
  const cleaned = str.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Decode HTML entities in text
 * &lt; → <, &gt; → >, &amp; → &, etc.
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHTMLEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Get value from INFO elements by label text
 * @param {Element} element - ANNONSE element
 * @param {string} label - Label text to search for
 * @returns {string} Value or empty string
 */
function getInfoValue(element, label) {
  const infoElements = element.querySelectorAll('INFO');
  for (const info of infoElements) {
    const ledetekst = info.querySelector('LEDETEKST');
    if (ledetekst && ledetekst.textContent.trim().toLowerCase() === label.toLowerCase()) {
      const verdi = info.querySelector('VERDI');
      return verdi ? verdi.textContent.trim() : '';
    }
  }
  return '';
}

/**
 * Parse XML element to normalized Car object
 * @param {Element} element - ANNONSE element with full data
 * @returns {Object} Normalized car object
 */
function parseCarElement(element) {
  if (!element) return null;

  // Basic data
  const id = getElementText(element, 'ID');
  const nr = getElementText(element, 'NR');
  const type = getElementText(element, 'TYPE');
  const status = getElementText(element, 'STATUS');

  // Get data from INFO elements
  const make = getInfoValue(element, 'Merke');
  const model = getInfoValue(element, 'Modell');
  const yearStr = getInfoValue(element, 'Årsmodell');
  const year = parseInt(yearStr, 10) || 0;
  const mileageStr = getInfoValue(element, 'Kilometer');
  const mileage = parseNorwegianNumber(mileageStr);
  const fuelType = getInfoValue(element, 'Drivstoff');
  const transmission = getInfoValue(element, 'Girkasse');
  const color = getInfoValue(element, 'Farge');
  const hp = getInfoValue(element, 'Effekt');

  // Price from SALG section
  const belopElement = element.querySelector('SALG BELOP');
  const price = belopElement ? parseNorwegianNumber(belopElement.textContent) : 0;

  // Location from UTSALGSSTED
  const location = getElementText(element, 'UTSALGSSTED');

  // Images from BILDER section
  const images = extractImages(element);

  // Equipment from UTSTYR section
  const equipment = extractEquipment(element);

  // Description from BESKRIVELSE (decode HTML entities)
  const descriptionRaw = getElementText(element, 'BESKRIVELSE');
  const description = descriptionRaw ? decodeHTMLEntities(descriptionRaw) : '';

  // Date added
  const dateAdded = getElementText(element, 'OPPRETTET');

  // Determine if car is new
  const isNew = year >= 2024 || status.toLowerCase().includes('ny');

  return {
    id,
    nr,
    type,
    status,
    make,
    model,
    year,
    mileage,
    price,
    fuelType,
    location,
    transmission,
    color,
    images,
    equipment,
    description,
    hp,
    co2: '',
    dateAdded,
    isNew
  };
}

/**
 * Check if cache is valid
 * @returns {boolean} True if cache exists and is not expired
 */
function isCacheValid() {
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  if (!timestamp) return false;

  const age = Date.now() - parseInt(timestamp, 10);
  return age < CACHE_TTL;
}

/**
 * Get cars from cache
 * @returns {Array<Object>|null} Cached cars or null
 */
function getCachedCars() {
  if (!isCacheValid()) return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache parse error:', error);
    return null;
  }
}

/**
 * Save cars to cache
 * @param {Array<Object>} cars - Cars to cache
 */
function setCachedCars(cars) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cars));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

/**
 * Fetch all cars from API or cache
 * @param {boolean} forceRefresh - Skip cache and fetch fresh data
 * @returns {Promise<Array<Object>>} Array of normalized car objects
 */
export async function getAllCars(forceRefresh = false) {
  // Check cache first unless force refresh
  if (!forceRefresh) {
    const cached = getCachedCars();
    if (cached) {
      console.log('Using cached car data');
      return cached;
    }
  }

  // Fetch fresh data
  console.log('Fetching fresh car data from API');
  const xmlDocs = await fetchBillinkData();

  // Parse each XML document (one per car)
  const cars = xmlDocs
    .map(xmlDoc => extractCarElement(xmlDoc))
    .filter(Boolean)
    .map(parseCarElement)
    .filter(Boolean);

  console.log(`Successfully parsed ${cars.length} cars`);

  // Cache the results
  setCachedCars(cars);

  return cars;
}

/**
 * Get a single car by ID
 * @param {string} id - Car ID
 * @returns {Promise<Object|null>} Car object or null if not found
 */
export async function getCarById(id) {
  const cars = await getAllCars();
  return cars.find(car => car.id === id) || null;
}

/**
 * Format price for display
 * 139000 → "kr 139 000"
 * @param {number} price - Price in NOK
 * @returns {string} Formatted price string
 */
export function formatPrice(price) {
  if (!price || price === 0) return 'Pris på forespørsel';
  return 'kr ' + price.toLocaleString('nb-NO');
}

/**
 * Format mileage for display
 * 15000 → "15 000 km"
 * @param {number} km - Mileage in kilometers
 * @returns {string} Formatted mileage string
 */
export function formatMileage(km) {
  if (!km || km === 0) return '0 km';
  return km.toLocaleString('nb-NO') + ' km';
}

/**
 * Clear cache (useful for debugging or manual refresh)
 */
export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
}
