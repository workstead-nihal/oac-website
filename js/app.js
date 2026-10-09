// Purpose: single-page navigation, Get Involved modal management and dynamic form loading.
'use strict';

// Form definitions for membership, volunteer and contact forms; work forms come from data/work.json.
// Each field has name, label, type, max (for text/textarea/tel/email/url), options (for select), or checkboxes (for the join interests group).
const FORM_DEFINITIONS = {
  join: {
    title: 'Join OAC — Find your people',
    legend: 'Your membership details',
    privacy: 'OAC uses these details for membership and community contact. Only authorised organisers can access the private Sheet. We don\u2019t collect your date of birth or payment details. Under 18? Ask a parent or guardian to review this before agreeing.',
    consentText: 'I agree to OAC storing these details for membership and contacting me about the community. If I am under 18, my parent or guardian has reviewed and agreed.',
    successTitle: 'Welcome to your next arc.',
    successText: 'Now find the crew online.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', max: 80 },
      { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', max: 20 },
      { name: 'email', label: 'Email', type: 'email', max: 254 },
      { name: 'city', label: 'City', type: 'text', max: 80 },
      { name: 'ageGroup', label: 'Age group', type: 'select', options: ['', 'under-18', '18-24', '25-34', '35-plus'], optionLabels: ['', 'Under 18', '18\u201324', '25\u201334', '35+'] },
      { name: 'source', label: 'How did you find us?', type: 'select', options: ['', 'friend', 'instagram', 'event', 'search', 'other'], optionLabels: ['', 'A friend', 'Instagram', 'An event', 'Online search', 'Other'] }
    ],
    interests: ['anime', 'cosplay', 'art', 'gaming', 'K-pop/J-pop', 'other']
  },
  volunteer: {
    title: 'Become a volunteer',
    legend: 'Your volunteer application',
    privacy: 'OAC uses these details only to review and respond to your request. Only authorised organisers can access the private Sheet. Do not send card details, passwords or private member records.',
    consentText: 'I agree to OAC storing this application and contacting me by email about volunteering.',
    successTitle: 'Application received!',
    successText: 'The OAC team can follow up by email. Thank you for offering to help.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', max: 80 },
      { name: 'email', label: 'Email', type: 'email', max: 254 },
      { name: 'city', label: 'City', type: 'text', max: 80 },
      { name: 'role', label: 'How would you like to help?', type: 'select', options: ['', 'events', 'art', 'photo', 'social', 'other'], optionLabels: ['', 'Events & welcoming', 'Art & cosplay', 'Photography', 'Social & community', 'Other'] },
      { name: 'availability', label: 'Availability', type: 'text', max: 240 },
      { name: 'message', label: 'A little about how you can help', type: 'textarea', max: 2000 }
    ]
  },
  contact: {
    title: 'Start a conversation',
    legend: 'Your enquiry',
    privacy: 'OAC uses these details only to review and respond to your request. Only authorised organisers can access the private Sheet. Do not send card details, passwords or private member records.',
    consentText: 'I agree to OAC storing this enquiry and contacting me by email about it.',
    successTitle: 'Enquiry received!',
    successText: 'The OAC team can follow up by email. Thank you for getting in touch.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', max: 80 },
      { name: 'email', label: 'Email', type: 'email', max: 254 },
      { name: 'organisation', label: 'Organisation / community', type: 'text', max: 120 },
      { name: 'enquiryType', label: 'What is your enquiry about?', type: 'select', options: ['', 'venue', 'sponsor', 'brand', 'community', 'other'], optionLabels: ['', 'Venue / mall partnership', 'Sponsorship', 'Brand collaboration', 'Community question or concern', 'Other'] },
      { name: 'message', label: 'Your message', type: 'textarea', max: 2000 }
    ]
  }
};

// Maps a form action to its receipt code; used by the submit handler to confirm a valid response.
const RECEIPT_CODES = {
  join: 'joined', volunteer: 'volunteer_received', contact: 'enquiry_received',
  stall: 'stall_received', sponsor: 'sponsor_received', partnership: 'partnership_received', creator: 'creator_received'
};

// Maps a form action to a human-readable success message.
const SUCCESS_MESSAGES = {
  join: 'You\u2019re in! Your membership request is confirmed. Welcome to the OAC family.',
  volunteer: 'Application received! The OAC team can follow up by email. Thank you for offering to help.',
  contact: 'Enquiry received! The OAC team can follow up by email. Thank you for getting in touch.',
  stall: 'Enquiry confirmed! The OAC team will review your stall application and contact you.',
  sponsor: 'Enquiry confirmed! The OAC team will review your sponsorship interest and contact you.',
  partnership: 'Enquiry confirmed! The OAC team will review your partnership proposal and contact you.',
  creator: 'Enquiry confirmed! The OAC team will review your creator application and contact you.'
};

// Maps a form action to error messages for known server response codes.
const ERROR_MESSAGES = {
  not_found: 'Not found, sign up now. No attendance was recorded.',
  unauthorized: 'Access code not accepted. Ask the event lead for the current volunteer code.',
  closed: 'Check-in is closed. The event lead must open the check-in window first.',
  invalid: 'Check your details and selected event, then try again.',
  setup: 'The community form is not fully configured. Please contact the OAC team.',
  busy: 'The Sheet is busy. Keep your entry here and retry in a moment.',
  rate_limit: 'Too many attempts. Please wait before trying again.'
};

// Shows one page-section and hides the rest; takes the section id and updates nav links.
function showSection(id) {
  for (const section of document.querySelectorAll('.page-section')) {
    section.classList.remove('active');
  }
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
  }
  for (const link of document.querySelectorAll('.nav-link')) {
    link.classList.remove('active');
    if (link.dataset.target === id) {
      link.classList.add('active');
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reads the URL hash on load and navigates to the matching section; defaults to home.
function handleHashChange() {
  const hash = window.location.hash.slice(1);
  const valid = ['home', 'events', 'showcase', 'volunteers', 'about', 'work'];
  if (valid.includes(hash)) {
    showSection(hash);
  } else if (!hash || hash === 'community-pages') {
    showSection('home');
  }
}

// Opens the Get Involved modal; shows the menu view and hides any previous form state.
function openModal() {
  const overlay = document.getElementById('involved-modal');
  overlay.hidden = false;
  document.getElementById('modal-menu').hidden = false;
  document.getElementById('modal-form-view').hidden = true;
  document.getElementById('modal-success').hidden = true;
  document.getElementById('modal-form').hidden = false;
  document.body.style.overflow = 'hidden';
}

// Closes the modal and restores page scrolling; resets pending form state.
function closeModal() {
  document.getElementById('involved-modal').hidden = true;
  document.body.style.overflow = '';
  window.OAC_MODAL.pendingEntry = null;
}

// Creates a labelled input element from a field definition; returns the wrapper div.
function createFieldElement(field) {
  const wrapper = document.createElement('div');
  const label = document.createElement('label');
  label.htmlFor = 'modal-field-' + field.name;
  label.textContent = field.label;
  if (field.type === 'select') {
    const select = document.createElement('select');
    select.id = label.htmlFor;
    select.name = field.name;
    select.required = true;
    const options = field.options || [];
    const labels = field.optionLabels || options;
    for (let i = 0; i < options.length; i++) {
      const option = document.createElement('option');
      option.value = options[i];
      option.textContent = labels[i] || (i === 0 ? 'Choose an option' : options[i]);
      select.append(option);
    }
    wrapper.append(label, select);
  } else if (field.type === 'textarea') {
    const textarea = document.createElement('textarea');
    textarea.id = label.htmlFor;
    textarea.name = field.name;
    textarea.required = true;
    textarea.maxLength = field.max;
    textarea.rows = 5;
    wrapper.append(label, textarea);
  } else {
    const input = document.createElement('input');
    input.id = label.htmlFor;
    input.name = field.name;
    input.required = true;
    input.maxLength = field.max;
    if (field.type === 'tel') {
      input.type = 'tel';
      input.inputMode = 'tel';
      input.placeholder = '10 digits or +91';
    } else if (field.type === 'email') {
      input.type = 'email';
    } else if (field.type === 'url') {
      input.type = 'url';
    } else {
      input.type = 'text';
    }
    wrapper.append(label, input);
  }
  return wrapper;
}

// Builds the interests checkbox group for the join form; returns a fieldset element.
function createInterestsFieldset(interests) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'interest-options';
  fieldset.id = 'modal-interests-group';
  const legend = document.createElement('legend');
  legend.textContent = 'Interests \u2014 choose at least one';
  fieldset.append(legend);
  for (const interest of interests) {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'interests';
    checkbox.value = interest;
    label.append(checkbox, document.createTextNode(interest));
    fieldset.append(label);
  }
  return fieldset;
}

// Loads a form definition into the modal; takes an action name and renders fields dynamically.
async function loadFormIntoModal(action) {
  const formView = document.getElementById('modal-form-view');
  const menu = document.getElementById('modal-menu');
  menu.hidden = true;
  formView.hidden = false;
  const form = document.getElementById('modal-form');
  const status = document.getElementById('modal-form-status');
  const submitBtn = document.getElementById('modal-submit');
  const success = document.getElementById('modal-success');
  const signupLink = document.getElementById('modal-signup-link');
  success.hidden = true;
  form.hidden = false;
  signupLink.hidden = true;
  form.dataset.action = action;
  window.OAC_MODAL.pendingEntry = null;
  window.OAC_MODAL.currentAction = action;
  const dynamicFields = document.getElementById('modal-dynamic-fields');
  dynamicFields.replaceChildren();
  let definition;
  if (FORM_DEFINITIONS[action]) {
    definition = FORM_DEFINITIONS[action];
  } else {
    // Work forms: load field definitions from data/work.json.
    try {
      const data = await readData('data/work.json');
      const workForm = data.forms.find(item => item.action === action);
      if (!workForm) {
        throw new Error('Unknown form');
      }
      definition = {
        title: workForm.title,
        legend: workForm.title + ' enquiry',
        privacy: 'OAC uses these details to review and respond to your enquiry. Authorised organisers access the private Sheet. This is an application, not a confirmed booking or payment.',
        consentText: 'I agree to OAC storing this enquiry and contacting me about it.',
        successTitle: 'Enquiry confirmed!',
        successText: 'The OAC team will review it and contact you using the details provided.',
        fields: workForm.fields
      };
    } catch {
      status.className = 'form-status error';
      status.textContent = 'Could not load this form. Check your connection and try again.';
      submitBtn.disabled = true;
      return;
    }
  }
  document.getElementById('modal-form-title').textContent = definition.title;
  document.getElementById('modal-form-legend').textContent = definition.legend;
  document.getElementById('modal-form-privacy').textContent = definition.privacy;
  document.getElementById('modal-consent-text').textContent = definition.consentText;
  window.OAC_MODAL.successTitle = definition.successTitle;
  window.OAC_MODAL.successText = definition.successText;
  // Render standard fields in a grid wrapper.
  const grid = document.createElement('div');
  grid.className = 'form-grid';
  for (const field of definition.fields) {
    grid.append(createFieldElement(field));
  }
  dynamicFields.append(grid);
  // Join form has an extra interests checkbox group.
  if (action === 'join' && definition.interests) {
    dynamicFields.append(createInterestsFieldset(definition.interests));
  }
  document.getElementById('modal-form-fields').disabled = false;
  submitBtn.disabled = false;
  submitBtn.textContent = action === 'join' ? 'Join the OAC family' : 'Send enquiry';
  if (window.OAC_CONFIG.appsScriptUrl) {
    status.className = 'form-status pending';
    status.textContent = 'Complete your details below. Keep this page open until your submission receipt arrives.';
  } else {
    status.className = 'form-status pending';
    status.textContent = 'Website submissions await backend setup. Your entry is sent only when a valid Apps Script endpoint is configured.';
  }
}

// Normalizes the phone input to an Indian mobile number; returns null for invalid input.
function modalFormPhone(value) {
  const text = value.trim();
  if (!/^[+\d\s()-]+$/.test(text)) {
    return null;
  }
  let digits = text.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

// Collects and validates the modal form into a request object; returns data or null on validation failure.
function collectModalEntry() {
  const form = document.getElementById('modal-form');
  const fields = new FormData(form);
  const action = form.dataset.action;
  const phoneInput = form.elements.phone;
  const phone = phoneInput ? modalFormPhone(String(fields.get('phone') || '')) : null;
  if (phoneInput) {
    phoneInput.setCustomValidity(phone ? '' : 'Enter a 10-digit Indian mobile number, optionally with +91.');
  }
  for (const input of form.elements) {
    if (input && input.name !== 'phone' && input.name !== 'consent' && input.name !== 'website' && input.name !== 'interests' && input.required && ['text', 'textarea', 'url', 'email', 'tel', 'select-one'].includes(input.type)) {
      input.setCustomValidity(input.value.trim() ? '' : 'Please fill in this field.');
      if (input.type === 'url' && input.value.trim() && !ticketAddress(input.value.trim())) {
        input.setCustomValidity('Use a complete HTTPS link, such as https://example.com.');
      }
    }
  }
  if (action === 'join') {
    const interestCheckbox = form.querySelector('[name="interests"]');
    if (interestCheckbox) {
      interestCheckbox.setCustomValidity(fields.getAll('interests').length ? '' : 'Choose at least one interest.');
    }
  }
  if (!form.reportValidity()) {
    return null;
  }
  const data = Object.fromEntries(fields.entries());
  data.action = action;
  if (phoneInput) {
    data.phone = phone;
  }
  if (action === 'join') {
    data.interests = fields.getAll('interests');
  }
  data.consent = fields.get('consent') === 'on';
  return data;
}

// Clears custom validation errors when any modal field changes; native checks still apply.
function clearModalFieldErrors() {
  const form = document.getElementById('modal-form');
  for (const input of form.elements) {
    if (typeof input.setCustomValidity === 'function') {
      input.setCustomValidity('');
    }
  }
}

// Sends one request to the Apps Script endpoint; returns a confirmed receipt or throws on uncertainty.
async function sendModalEntry(entry) {
  const endpoint = window.OAC_CONFIG.appsScriptUrl;
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) {
    throw new Error('unconfigured');
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST', credentials: 'omit', redirect: 'follow', signal: controller.signal,
      body: new URLSearchParams({ payload: JSON.stringify(entry) })
    });
    if (!response.ok) {
      throw new Error('network');
    }
    const result = await response.json();
    if (result.requestId !== entry.requestId || typeof result.ok !== 'boolean' || typeof result.code !== 'string') {
      throw new Error('receipt');
    }
    return result;
  } finally {
    window.clearTimeout(timeout);
  }
}

// Shows a status message in the modal form; takes a state class and message text.
function showModalStatus(state, message) {
  const status = document.getElementById('modal-form-status');
  status.className = 'form-status ' + state;
  status.textContent = message;
  if (state === 'error' || state === 'success') {
    status.focus();
  }
}

// Handles the modal form submit; validates, sends, shows success/error, and preserves entries for retry.
async function handleModalSubmit(event) {
  event.preventDefault();
  if (window.OAC_MODAL.submitting) {
    return;
  }
  const data = collectModalEntry();
  if (!data) {
    showModalStatus('error', 'Please check the highlighted field and try again.');
    return;
  }
  const signature = JSON.stringify(data);
  if (!window.OAC_MODAL.pendingEntry || window.OAC_MODAL.pendingEntry.signature !== signature) {
    window.OAC_MODAL.pendingEntry = { signature: signature, data: { ...data, requestId: crypto.randomUUID() } };
  }
  window.OAC_MODAL.submitting = true;
  const submitBtn = document.getElementById('modal-submit');
  const fieldset = document.getElementById('modal-form-fields');
  submitBtn.disabled = true;
  fieldset.disabled = true;
  document.getElementById('modal-signup-link').hidden = true;
  showModalStatus('pending', 'Sending\u2026 please keep this page open.');
  try {
    const result = await sendModalEntry(window.OAC_MODAL.pendingEntry.data);
    const accepted = RECEIPT_CODES[data.action];
    if (result.ok && result.code === accepted) {
      showModalStatus('success', SUCCESS_MESSAGES[data.action] || 'Enquiry confirmed!');
      window.OAC_MODAL.pendingEntry = null;
      submitBtn.textContent = 'Submission confirmed';
      document.getElementById('modal-form').hidden = true;
      const success = document.getElementById('modal-success');
      success.hidden = false;
      document.getElementById('modal-success-title').textContent = window.OAC_MODAL.successTitle;
      document.getElementById('modal-success-text').textContent = window.OAC_MODAL.successText;
      // For join: show social links in the success panel.
      if (data.action === 'join') {
        loadModalSuccessSocials();
      }
    } else {
      showModalStatus('error', ERROR_MESSAGES[result.code] || 'The server could not confirm this entry. Keep the page open and retry.');
      document.getElementById('modal-signup-link').hidden = result.code !== 'not_found';
      submitBtn.textContent = 'Retry';
    }
  } catch (error) {
    showModalStatus('error', error.message === 'unconfigured' ? 'This form is awaiting backend setup. Your details have not been sent.' : 'No confirmation received. Your entry is still here. Keep this page open and retry; it may already have reached the Sheet.');
    submitBtn.textContent = 'Retry';
  } finally {
    window.OAC_MODAL.submitting = false;
    fieldset.disabled = false;
    submitBtn.disabled = false;
  }
}

// Loads approved social links into the modal success panel for the join form; returns nothing.
async function loadModalSuccessSocials() {
  const container = document.getElementById('modal-success-socials');
  try {
    const links = await readData('data/links.json');
    const socials = links.items.filter(link => ['WhatsApp', 'Discord'].includes(link.label) && ticketAddress(link.url));
    container.replaceChildren();
    if (socials.length) {
      for (const social of socials) {
        const button = document.createElement('a');
        button.className = 'button';
        button.href = ticketAddress(social.url);
        button.textContent = 'Join our ' + social.label + ' \u2197';
        addSocialIcon(button, social.label);
        container.append(button);
      }
    } else {
      const note = document.createElement('p');
      note.className = 'sample-note';
      note.textContent = 'WhatsApp / Discord links coming soon';
      container.append(note);
    }
  } catch {
    container.textContent = 'Community links could not load right now.';
  }
}

// Loads social link buttons into the modal menu footer; returns nothing.
async function loadModalSocials() {
  const container = document.getElementById('modal-socials');
  try {
    const links = await readData('data/links.json');
    const socials = links.items.filter(link => ticketAddress(link.url));
    container.replaceChildren();
    for (const social of socials) {
      const button = document.createElement('a');
      button.href = ticketAddress(social.url);
      button.textContent = social.label;
      addSocialIcon(button, social.label);
      container.append(button);
    }
  } catch {
    container.textContent = '';
  }
}

// Loads the existing Google signup fallback link into the modal menu; returns nothing.
async function loadModalSignupFallback() {
  try {
    const links = await readData('data/links.json');
    const address = ticketAddress(links.signupFormUrl);
    if (address) {
      const container = document.getElementById('modal-socials');
      const fallback = document.createElement('a');
      fallback.href = address;
      fallback.textContent = 'Google sign-up form \u2197';
      container.append(fallback);
    }
  } catch {
    // The menu still works without the fallback link.
  }
}

// Warns before leaving while a modal entry is awaiting a receipt.
function warnModalPending(event) {
  if (window.OAC_MODAL.pendingEntry) {
    event.preventDefault();
    event.returnValue = '';
  }
}

// Initializes the single-page app: navigation, modal events and shared state.
function initApp() {
  // Global modal state object; keeps pending entries and submit flag for safe retries.
  window.OAC_MODAL = { pendingEntry: null, submitting: false, currentAction: null, successTitle: '', successText: '' };
  // Navigation: handle hash changes for section routing.
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
  // Modal open buttons.
  document.getElementById('get-involved-btn').addEventListener('click', openModal);
  document.getElementById('mobile-involved-btn').addEventListener('click', openModal);
  document.getElementById('hero-join-btn').addEventListener('click', openModal);
  // Quick card buttons that open the modal with a specific form.
  for (const btn of document.querySelectorAll('[data-involved]')) {
    btn.addEventListener('click', function openSpecificForm() {
      openModal();
      loadFormIntoModal(btn.dataset.involved);
    });
  }
  // Modal close: button, overlay click and Escape key.
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('involved-modal').addEventListener('click', function overlayClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  });
  document.addEventListener('keydown', function escapeKey(event) {
    if (event.key === 'Escape' && !document.getElementById('involved-modal').hidden) {
      closeModal();
    }
  });
  // Modal back button: return to the menu from a form view.
  document.getElementById('modal-back-btn').addEventListener('click', function backToMenu() {
    document.getElementById('modal-form-view').hidden = true;
    document.getElementById('modal-menu').hidden = false;
    window.OAC_MODAL.pendingEntry = null;
  });
  // Modal option buttons: load the selected form into the modal.
  for (const option of document.querySelectorAll('.modal-option')) {
    option.addEventListener('click', function selectForm() {
      loadFormIntoModal(option.dataset.form);
    });
  }
  // Modal form submit and input clearing.
  document.getElementById('modal-form').addEventListener('submit', handleModalSubmit);
  document.getElementById('modal-form').addEventListener('input', clearModalFieldErrors);
  // Warn before leaving with a pending entry.
  window.addEventListener('beforeunload', warnModalPending);
  // Load social links and signup fallback into the modal menu.
  loadModalSocials();
  loadModalSignupFallback();
}

initApp();
