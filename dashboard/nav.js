// nav.js - navigation bar logic (theme, user, notifications)
import { api } from './api.js';

function initTheme() {
	const saved = localStorage.getItem('linksync-theme');
	if (saved) {
		document.documentElement.setAttribute('data-theme', saved);
		return;
	}
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme:light)').matches) {
		document.documentElement.setAttribute('data-theme', 'light');
	}
}

export function toggleTheme() {
	const current = document.documentElement.getAttribute('data-theme');
	const next = current === 'light' ? 'dark' : 'light';
	document.documentElement.setAttribute('data-theme', next);
	localStorage.setItem('linksync-theme', next);
}

export async function loadCurrentUser() {
	try {
		const { response, payload } = await api('/me', { method: 'GET' });
		if (!response.ok || !payload?.success) {
			return null;
		}
		return payload.data;
	} catch (e) {
		return null;
	}
}

// Call on page load
initTheme();

document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme);
// nav.js - minimal interactivity for nav.html
