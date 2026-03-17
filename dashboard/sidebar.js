// sidebar.js - sidebar logic (filters, view, section switching)
import { esc } from './helpers.js';

export let currentFilter = 'all';
export let currentView = 'list';
export let currentSection = 'bookmarks';

export function setCategoryFilter(tag) {
  currentFilter = tag;
  document.querySelectorAll('.fpill').forEach(b => b.classList.toggle('on', b.dataset.filter === tag));
  render();
}

export function setView(v) {
  currentView = v;
  document.getElementById('vList')?.classList.toggle('on', v === 'list');
  document.getElementById('vGrid')?.classList.toggle('on', v === 'grid');
  document.getElementById('vTable')?.classList.toggle('on', v === 'table');
  render();
}

export function switchSection(section) {
  currentSection = section;
  // Add logic to update UI for section switching
  render();
}

function render() {
  // Placeholder: implement maincontent rendering logic or trigger maincontent.js
}
