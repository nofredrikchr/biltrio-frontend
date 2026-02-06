/**
 * Billink XML API Integration
 * Fetches and parses car data from Billink XML endpoint
 */

const BILLINK_BASE_URL = 'https://billink.no/page2_xml.php';
const BILLINK_PARAMS = 'kode=6d70a359-bcc4-45ff-9e40-2fba10c08bac&butikk=berglyhallen';

// Use Vercel serverless function for proxy (works both locally and in production)
const PROXY_URL = '/api/proxy?url=';

/**
 * Fetch XML from URL using local proxy
 * @param {string} url - URL to fetch
 * @returns {Promise<Document>} Parsed XML document
 */
async function fetchXML(url) {
  try {
    // Use Vercel serverless function proxy to avoid CORS issues
    const proxyUrl = PROXY_URL + encodeURIComponent(url);
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    return parseXML(xmlText);
  } catch (error) {
    console.error('Failed to fetch XML:', error);
    throw new Error('Kunne ikke laste bildata. Prøv igjen senere.');
  }
}

/**
 * Fetch list of car IDs from Billink API
 * @returns {Promise<Array<string>>} Array of car IDs
 */
export async function fetchCarIds() {
  const url = `${BILLINK_BASE_URL}?${BILLINK_PARAMS}`;
  const xmlDoc = await fetchXML(url);
  const annonser = xmlDoc.querySelectorAll('ANNONSE');

  return Array.from(annonser).map(annonse => {
    const id = annonse.querySelector('ID');
    return id ? id.textContent.trim() : null;
  }).filter(Boolean);
}

/**
 * Fetch full data for a specific car
 * @param {string} carId - Car ID
 * @returns {Promise<Document>} Parsed XML document with full car data
 */
export async function fetchCarDetails(carId) {
  const url = `${BILLINK_BASE_URL}?${BILLINK_PARAMS}&annonse_id=${carId}`;
  return await fetchXML(url);
}

/**
 * Fetch all car data (IDs + details for each)
 * @returns {Promise<Array<Document>>} Array of XML documents with full car data
 */
export async function fetchBillinkData() {
  console.log('Fetching car IDs...');
  const carIds = await fetchCarIds();
  console.log(`Found ${carIds.length} cars, fetching details...`);

  // Fetch details for each car (in batches to avoid overwhelming the API)
  const batchSize = 5;
  const carDetails = [];

  for (let i = 0; i < carIds.length; i += batchSize) {
    const batch = carIds.slice(i, i + batchSize);
    const batchPromises = batch.map(id => fetchCarDetails(id));
    const batchResults = await Promise.all(batchPromises);
    carDetails.push(...batchResults);

    // Log progress
    console.log(`Loaded ${Math.min(i + batchSize, carIds.length)}/${carIds.length} cars`);
  }

  return carDetails;
}

/**
 * Parse XML text to Document
 * @param {string} xmlText - Raw XML string
 * @returns {Document} Parsed XML document
 */
function parseXML(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check for parse errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('XML parsing failed: ' + parseError.textContent);
  }

  return xmlDoc;
}

/**
 * Extract car element from detailed XML document
 * @param {Document} xmlDoc - Parsed XML document with full car data
 * @returns {Element|null} ANNONSE element
 */
export function extractCarElement(xmlDoc) {
  const annonse = xmlDoc.querySelector('ANNONSE');
  return annonse;
}

/**
 * Get text content from XML element, handling missing elements
 * @param {Element} element - Parent element
 * @param {string} tagName - Tag name to find
 * @returns {string} Text content or empty string
 */
export function getElementText(element, tagName) {
  const found = element.querySelector(tagName);
  return found ? found.textContent.trim() : '';
}

/**
 * Get all image URLs from BILDE elements
 * @param {Element} element - ANNONSE element
 * @returns {Array<string>} Array of image URLs
 */
export function extractImages(element) {
  const bildeElements = element.querySelectorAll('BILDE');
  if (!bildeElements || bildeElements.length === 0) return [];

  const images = [];
  bildeElements.forEach(bilde => {
    const urlElement = bilde.querySelector('URL');
    if (urlElement) {
      const url = urlElement.textContent.trim();
      if (url) images.push(url);
    }
  });

  return images;
}

/**
 * Get all equipment items from UTSTYR elements
 * @param {Element} element - ANNONSE element
 * @returns {Array<string>} Array of equipment items
 */
export function extractEquipment(element) {
  const utstyrElements = element.querySelectorAll('UTSTYR');
  if (!utstyrElements || utstyrElements.length === 0) return [];

  const equipment = [];
  utstyrElements.forEach(utstyr => {
    const navnElement = utstyr.querySelector('NAVN');
    if (navnElement) {
      const navn = navnElement.textContent.trim();
      if (navn) equipment.push(navn);
    }
  });

  return equipment;
}
