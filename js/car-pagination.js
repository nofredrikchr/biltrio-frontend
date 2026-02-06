/**
 * Car Pagination
 * Handles pagination logic and rendering
 */

const CARS_PER_PAGE = 12;

/**
 * Paginate cars array
 * @param {Array<Object>} cars - Array of car objects
 * @param {number} page - Page number (1-indexed)
 * @returns {Object} Paginated results
 */
export function paginateCars(cars, page = 1) {
  const totalCars = cars.length;
  const totalPages = Math.ceil(totalCars / CARS_PER_PAGE);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (currentPage - 1) * CARS_PER_PAGE;
  const endIndex = startIndex + CARS_PER_PAGE;
  const paginatedCars = cars.slice(startIndex, endIndex);

  return {
    cars: paginatedCars,
    currentPage,
    totalPages,
    totalCars,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, totalCars)
  };
}

/**
 * Generate page numbers to display
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @returns {Array<number|string>} Array of page numbers and ellipsis
 */
function generatePageNumbers(currentPage, totalPages) {
  const pages = [];

  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage <= 3) {
      // Near start
      for (let i = 2; i <= 4; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near end
      pages.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Middle
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
  }

  return pages;
}

/**
 * Render pagination HTML
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @returns {string} HTML string for pagination
 */
export function renderPagination(currentPage, totalPages) {
  if (totalPages <= 1) {
    return '';
  }

  const pages = generatePageNumbers(currentPage, totalPages);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  let html = '';

  // Previous button
  html += `
    <button
      class="pagination__button"
      data-page="${currentPage - 1}"
      ${!hasPrevious ? 'disabled' : ''}
      aria-label="Forrige side"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;

  // Page numbers
  pages.forEach(page => {
    if (page === '...') {
      html += '<span class="pagination__ellipsis">...</span>';
    } else {
      html += `
        <button
          class="pagination__button ${page === currentPage ? 'active' : ''}"
          data-page="${page}"
          aria-label="Side ${page}"
          ${page === currentPage ? 'aria-current="page"' : ''}
        >
          ${page}
        </button>
      `;
    }
  });

  // Next button
  html += `
    <button
      class="pagination__button"
      data-page="${currentPage + 1}"
      ${!hasNext ? 'disabled' : ''}
      aria-label="Neste side"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;

  return html;
}

/**
 * Scroll to top of page smoothly
 */
export function scrollToTop() {
  const nav = document.getElementById('nav');
  const navHeight = nav ? nav.offsetHeight : 0;
  const targetPosition = document.querySelector('.inventory').offsetTop - navHeight - 20;

  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
}
