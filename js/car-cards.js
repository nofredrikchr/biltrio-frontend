/**
 * Car Card Rendering
 * Generates HTML for car cards used in featured section and inventory grid
 */

import { formatPrice, formatMileage } from './car-data.js';

/**
 * Get placeholder image URL
 * @returns {string} Data URL for placeholder image
 */
function getPlaceholderImage() {
  // Simple gray placeholder with car icon SVG
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23E4E4E7" width="400" height="300"/%3E%3Cpath fill="%23A1A1AA" d="M200 120c-22 0-40 18-40 40v20h-20c-5.5 0-10 4.5-10 10v20c0 5.5 4.5 10 10 10h20v-20h80v20h20c5.5 0 10-4.5 10-10v-20c0-5.5-4.5-10-10-10h-20v-20c0-22-18-40-40-40zm-20 50c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10zm40 0c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z"/%3E%3C/svg%3E';
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Render a car card
 * @param {Object} car - Car object
 * @returns {string} HTML string for car card
 */
export function renderCarCard(car) {
  const imageUrl = car.images && car.images.length > 0 ? car.images[0] : getPlaceholderImage();
  const title = `${car.make} ${car.model}`;
  const subtitle = `${car.year} • ${formatMileage(car.mileage)}`;
  const price = formatPrice(car.price);
  const location = car.location || 'Ukjent lokasjon';
  const fuelType = car.fuelType || '';
  const detailUrl = `bil.html?id=${encodeURIComponent(car.id)}`;

  // Create badge HTML if car is new
  const badgeHtml = car.isNew ? '<span class="car-card__badge car-card__badge--new">Ny</span>' : '';

  // Create metadata items
  const metaItems = [];
  if (fuelType) metaItems.push(fuelType);
  if (car.transmission) metaItems.push(car.transmission);
  if (location) metaItems.push(location);
  const metaHtml = metaItems.map(item => `<span>${escapeHtml(item)}</span>`).join(' • ');

  return `
    <article class="car-card" data-car-id="${escapeHtml(car.id)}">
      <a href="${detailUrl}" class="car-card__link">
        <div class="car-card__image">
          <img
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(title)}"
            loading="lazy"
            onerror="this.src='${getPlaceholderImage()}'"
          >
          ${badgeHtml}
        </div>
        <div class="car-card__content">
          <h3 class="car-card__title">${escapeHtml(title)}</h3>
          <p class="car-card__subtitle">${escapeHtml(subtitle)}</p>
          <p class="car-card__price">${price}</p>
          <div class="car-card__meta">${metaHtml}</div>
        </div>
      </a>
    </article>
  `;
}

/**
 * Render multiple car cards
 * @param {Array<Object>} cars - Array of car objects
 * @returns {string} HTML string for all car cards
 */
export function renderCarCards(cars) {
  return cars.map(renderCarCard).join('');
}

/**
 * Render loading skeleton for car cards
 * @param {number} count - Number of skeleton cards to render
 * @returns {string} HTML string for skeleton cards
 */
export function renderLoadingSkeleton(count = 12) {
  const skeletonCard = `
    <div class="car-card car-card--skeleton">
      <div class="car-card__image skeleton"></div>
      <div class="car-card__content">
        <div class="skeleton skeleton--text"></div>
        <div class="skeleton skeleton--text skeleton--small"></div>
        <div class="skeleton skeleton--text skeleton--medium"></div>
      </div>
    </div>
  `;

  return Array(count).fill(skeletonCard).join('');
}
