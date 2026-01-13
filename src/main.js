import './style.css'
import { concepts } from './data.js'

document.querySelector('#app').innerHTML = `
  <header>
    <h1>Math Visualizer</h1>
    <p class="intro">Explore and visualize complex mathematical concepts with ease.</p>
  </header>

  <section id="how-to">
    <h2>How to Use</h2>
    <p>Browse the gallery below or use the search bar to find a specific concept. Click on any card to view its visualization (coming soon).</p>
  </section>

  <div id="search-container">
    <svg class="search-icon" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
    </svg>
    <input type="text" id="search-input" placeholder="Search concepts..." autocomplete="off">
  </div>

  <main id="gallery">
    <!-- Concepts will be injected here -->
  </main>
`

const galleryEl = document.querySelector('#gallery');
const searchInput = document.querySelector('#search-input');
const introSection = document.querySelector('header');
const howToSection = document.querySelector('#how-to');
const searchContainer = document.querySelector('#search-container');


// Visualizer Imports
import { renderIntegral } from './visualizers/integral.js';
import { initDerivativeVisualizer } from './derivative.js';

function renderConcepts(items) {
  if (items.length === 0) {
    galleryEl.innerHTML = '<div class="no-results">No concepts found matching your search.</div>';
    return;
  }

  galleryEl.innerHTML = items.map(concept => `
    <div class="concept-card" data-id="${concept.id}">
      <div class="card-icon">${concept.icon}</div>
      <h3 class="card-title">${concept.title}</h3>
      <p class="card-desc">${concept.description}</p>
      <span class="card-category">${concept.category}</span>
    </div>
  `).join('');

  // Add click listeners
  document.querySelectorAll('.concept-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (id === 'integral' || id === 'derivative') {
        navigateToVisualizer(id);
      } else {
        console.log(`Clicked on concept: ${id} (No visualizer yet)`);
        alert('Visualization coming soon for ' + id);
      }
    });
  });
}

function navigateToVisualizer(id) {
  // Hide home elements
  introSection.style.display = 'none';
  howToSection.style.display = 'none';
  searchContainer.style.display = 'none';

  // Clear gallery and render visualizer
  galleryEl.innerHTML = '';
  galleryEl.classList.remove('gallery-grid');

  // Add back button
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back to Gallery';
  backBtn.style.cssText = 'margin-bottom: 20px; padding: 10px; cursor: pointer; display: block;';
  backBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('navigate', { detail: 'home' }));
  });
  galleryEl.appendChild(backBtn);

  const container = document.createElement('div');
  galleryEl.appendChild(container);

  if (id === 'integral') {
    renderIntegral(container);
  } else if (id === 'derivative') {
    initDerivativeVisualizer(container);
  }
}

function navigateHome() {
  // Show home elements
  introSection.style.display = 'block';
  howToSection.style.display = 'block';
  searchContainer.style.display = 'flex';

  // Re-render gallery
  filterConcepts(searchInput.value);
}

// Listen for custom navigation event from visualizers
document.addEventListener('navigate', (e) => {
  if (e.detail === 'home') {
    navigateHome();
  }
});

function filterConcepts(query) {
  const lowerQuery = query.toLowerCase();
  const filtered = concepts.filter(concept =>
    concept.title.toLowerCase().includes(lowerQuery) ||
    concept.description.toLowerCase().includes(lowerQuery) ||
    concept.category.toLowerCase().includes(lowerQuery)
  );
  renderConcepts(filtered);
}

// Initial render
renderConcepts(concepts);

// Search listener
searchInput.addEventListener('input', (e) => {
  filterConcepts(e.target.value);
});
