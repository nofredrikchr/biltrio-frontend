/**
 * Car Detail Page Script
 */

import { getCarById, getAllCars, formatPrice, formatMileage } from './car-data.js';
import { renderCarCard } from './car-cards.js';

// DOM elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const carContent = document.getElementById('carContent');
const carBreadcrumb = document.getElementById('carBreadcrumb');
const carTitle = document.getElementById('carTitle');
const carPrice = document.getElementById('carPrice');
const contactPrice = document.getElementById('contactPrice');
const mainImage = document.getElementById('mainImage');
const thumbnails = document.getElementById('thumbnails');
const specs = document.getElementById('specs');
const equipment = document.getElementById('equipment');
const description = document.getElementById('description');
const relatedCars = document.getElementById('relatedCars');

/**
 * Get placeholder image URL
 */
function getPlaceholderImage() {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23E4E4E7" width="400" height="300"/%3E%3Cpath fill="%23A1A1AA" d="M200 120c-22 0-40 18-40 40v20h-20c-5.5 0-10 4.5-10 10v20c0 5.5 4.5 10 10 10h20v-20h80v20h20c5.5 0 10-4.5 10-10v-20c0-5.5-4.5-10-10-10h-20v-20c0-22-18-40-40-40zm-20 50c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10zm40 0c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z"/%3E%3C/svg%3E';
}

/**
 * Render gallery
 */
function renderGallery(car) {
  const images = car.images && car.images.length > 0 ? car.images : [getPlaceholderImage()];

  // Set main image
  mainImage.src = images[0];
  mainImage.alt = `${car.make} ${car.model}`;
  mainImage.onerror = () => {
    mainImage.src = getPlaceholderImage();
  };

  // Render thumbnails
  if (images.length > 1) {
    thumbnails.innerHTML = images.map((img, index) => `
      <div class="gallery__thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
        <img src="${img}" alt="${car.make} ${car.model} bilde ${index + 1}" onerror="this.src='${getPlaceholderImage()}'">
      </div>
    `).join('');

    // Add click handlers
    thumbnails.querySelectorAll('.gallery__thumbnail').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const index = parseInt(thumb.dataset.index, 10);
        mainImage.src = images[index];

        // Update active state
        thumbnails.querySelectorAll('.gallery__thumbnail').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  } else {
    thumbnails.style.display = 'none';
  }
}

/**
 * Render specifications
 */
function renderSpecs(car) {
  const specItems = [
    { label: 'Årsmodell', value: car.year || 'Ukjent' },
    { label: 'Kilometerstand', value: formatMileage(car.mileage) },
    { label: 'Drivstoff', value: car.fuelType || 'Ukjent' },
    { label: 'Girkasse', value: car.transmission || 'Ukjent' },
    { label: 'Farge', value: car.color || 'Ukjent' },
    { label: 'Lokasjon', value: car.location || 'Ukjent' }
  ];

  // Add optional specs if available
  if (car.hp) {
    specItems.push({ label: 'Hestekrefter', value: `${car.hp} hk` });
  }
  if (car.co2) {
    specItems.push({ label: 'CO2-utslipp', value: `${car.co2} g/km` });
  }

  specs.innerHTML = specItems.map(spec => `
    <div class="spec-item">
      <span class="spec-item__label">${spec.label}</span>
      <span class="spec-item__value">${spec.value}</span>
    </div>
  `).join('');
}

/**
 * Render equipment
 */
function renderEquipment(car) {
  if (!car.equipment || car.equipment.length === 0) {
    equipment.innerHTML = '<p style="color: var(--slate);">Ingen utstyrsinformasjon tilgjengelig.</p>';
    return;
  }

  // Limit to reasonable number of items to display
  const displayItems = car.equipment.slice(0, 50);

  equipment.innerHTML = displayItems.map(item => `
    <div class="equipment-item">${item}</div>
  `).join('');

  // Add "show more" if there are more items
  if (car.equipment.length > 50) {
    equipment.innerHTML += `<p style="color: var(--slate); margin-top: 12px; font-size: 14px;">+ ${car.equipment.length - 50} flere utstyrsdetaljer</p>`;
  }
}

/**
 * Render description
 */
function renderDescription(car) {
  if (!car.description || car.description.trim() === '') {
    description.innerHTML = '<p style="color: var(--slate);">Ingen beskrivelse tilgjengelig.</p>';
    return;
  }

  // Split description into paragraphs
  const paragraphs = car.description
    .split(/\n\n+/)
    .filter(p => p.trim() !== '')
    .map(p => `<p>${p.trim()}</p>`)
    .join('');

  description.innerHTML = `<div class="description-text">${paragraphs}</div>`;
}

/**
 * Render related cars
 */
async function renderRelatedCars(car) {
  try {
    const allCars = await getAllCars();

    // Find similar cars (same make or similar type)
    const similar = allCars
      .filter(c => c.id !== car.id) // Exclude current car
      .filter(c => c.make === car.make || c.type === car.type) // Same make or type
      .slice(0, 3); // Limit to 3

    if (similar.length === 0) {
      // If no similar cars, just show first 3 cars
      const fallback = allCars.filter(c => c.id !== car.id).slice(0, 3);
      relatedCars.innerHTML = fallback.map(c => renderCarCard(c)).join('');
    } else {
      relatedCars.innerHTML = similar.map(c => renderCarCard(c)).join('');
    }
  } catch (error) {
    console.error('Failed to load related cars:', error);
    relatedCars.innerHTML = '<p style="text-align: center; color: var(--slate);">Kunne ikke laste lignende biler.</p>';
  }
}

/**
 * Show error state
 */
function showError() {
  loadingState.style.display = 'none';
  errorState.style.display = 'block';
  carContent.style.display = 'none';
}

/**
 * Update page title
 */
function updatePageTitle(car) {
  document.title = `${car.make} ${car.model} ${car.year} — Biltrio`;
}

/**
 * Initialize detail page
 */
async function initialize() {
  // Get car ID from URL
  const params = new URLSearchParams(window.location.search);
  const carId = params.get('id');

  if (!carId) {
    showError();
    return;
  }

  try {
    // Fetch car data
    const car = await getCarById(carId);

    if (!car) {
      showError();
      return;
    }

    // Update page
    updatePageTitle(car);

    const title = `${car.make} ${car.model}`;
    const subtitle = car.year ? ` (${car.year})` : '';

    carBreadcrumb.textContent = title;
    carTitle.textContent = title + subtitle;
    carPrice.textContent = formatPrice(car.price);
    contactPrice.textContent = formatPrice(car.price);

    // Render sections
    renderGallery(car);
    renderSpecs(car);
    renderEquipment(car);
    renderDescription(car);
    await renderRelatedCars(car);

    // Show content
    loadingState.style.display = 'none';
    carContent.style.display = 'block';

  } catch (error) {
    console.error('Failed to load car details:', error);
    showError();
  }
}

// Initialize on load
initialize();
