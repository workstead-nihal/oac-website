// Purpose: small shared helpers for reading JSON and choosing upcoming community events.
'use strict';

// Reads JSON at a relative path; returns parsed content or throws so the page can offer a retry.
async function readData(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error('Community content could not be loaded.');
  }
  return response.json();
}

// Splits an event array at India's current calendar date; returns sorted upcoming and past arrays.
// A date-only event remains upcoming for its entire day because its actual end time is unknown.
function groupEvents(events, now) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
  const valid = events.filter(event => Number.isFinite(Date.parse(event.countdownDate)));
  valid.sort((first, second) => Date.parse(first.countdownDate) - Date.parse(second.countdownDate));
  return {
    upcoming: valid.filter(event => event.countdownDate.slice(0, 10) >= today),
    past: valid.filter(event => event.countdownDate.slice(0, 10) < today).reverse()
  };
}

// Accepts an editable URL and returns a safe HTTPS address or null; rejects executable schemes.
function ticketAddress(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

// Adds a small local platform icon before the existing visible label; input: element/platform, output: no value.
// Empty alt text avoids repeating the label for screen readers; a fixed allowlist prevents injected asset paths.
function addSocialIcon(element, platform) {
  const icons = { Instagram: 'instagram', Discord: 'discord', Reddit: 'reddit', WhatsApp: 'whatsapp' };
  const icon = icons[platform];
  if (!icon) {
    return;
  }
  const image = document.createElement('img');
  image.src = 'assets/icons/' + icon + '.svg';
  image.alt = '';
  image.width = 22;
  image.height = 22;
  image.className = 'social-icon';
  image.setAttribute('aria-hidden', 'true');
  element.classList.add('social-platform');
  element.prepend(image);
}
