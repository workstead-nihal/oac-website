// Purpose: populate student-editable volunteer, story, rules, FAQ, social and donation content safely.
'use strict';

// Creates a literal-text element from a tag, class and text; returns the element without executing HTML.
function communityElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

// Accepts a local photo/QR path and returns its URL or null; forbids external trackers and traversal.
function communityImage(value) {
  if (typeof value !== 'string' || !/^assets\/images\/web\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(value)) {
    return null;
  }
  return value;
}

// Fills volunteer cards from an array; returns nothing, uses initials when no approved photo exists.
function showVolunteers(items) {
  const grid = document.getElementById('volunteer-grid');
  grid.replaceChildren();
  for (const volunteer of items) {
    const card = communityElement('article', 'catalogue-card volunteer-card', '');
    const initials = communityElement('span', 'volunteer-initials', volunteer.initials || volunteer.name.slice(0, 2).toUpperCase());
    initials.setAttribute('aria-hidden', 'true');
    const photo = communityImage(volunteer.photo);
    if (photo) {
      const image = document.createElement('img');
      image.src = photo;
      image.alt = 'Portrait of ' + volunteer.name;
      image.width = 160;
      image.height = 160;
      image.loading = 'lazy';
      image.decoding = 'async';
      // Restores initials on a missing image; input: image error event, output: no value.
      image.addEventListener('error', function showInitials() { image.replaceWith(initials); });
      card.append(image);
    } else {
      card.append(initials);
    }
    if (volunteer.sample) {
      card.append(communityElement('p', 'eyebrow', 'EDITABLE SAMPLE PROFILE'));
    }
    card.append(communityElement('h3', '', volunteer.name), communityElement('p', 'role-label', volunteer.role), communityElement('p', '', volunteer.line));
    grid.append(card);
  }
  if (!items.length) {
    grid.append(communityElement('p', '', 'Our volunteer showcase is being prepared. You can still apply below.'));
  }
}

// Fills story, rules, donation or FAQ containers present on the page; returns nothing.
function showCommunity(data) {
  const story = document.getElementById('community-story');
  if (story) {
    story.replaceChildren();
    for (const paragraph of data.story) {
      story.append(communityElement('p', '', paragraph));
    }
  }
  const rules = document.getElementById('community-rules');
  if (rules) {
    rules.replaceChildren();
    for (const rule of data.rules) {
      const card = communityElement('article', 'catalogue-card', '');
      card.append(communityElement('h3', '', rule.title), communityElement('p', '', rule.text));
      rules.append(card);
    }
  }
  const faq = document.getElementById('faq-list');
  if (faq) {
    faq.replaceChildren();
    for (const item of data.faq) {
      const details = document.createElement('details');
      details.append(communityElement('summary', '', item.question), communityElement('p', '', item.answer));
      faq.append(details);
    }
  }
  if (document.getElementById('donation-intro')) {
    showDonation(data.donation);
  }
}

// Clears payment details before loading or rerendering; takes no inputs and leaves a safe disabled placeholder.
function resetDonationPanel() {
  document.getElementById('upi-qr').src = 'assets/upi-placeholder.svg';
  document.getElementById('upi-qr').alt = 'UPI placeholder — not a QR code and not for payment';
  document.getElementById('upi-id').textContent = 'REPLACE WITH VERIFIED UPI ID';
  document.getElementById('upi-recipient').textContent = 'Recipient name to be confirmed';
  document.getElementById('donation-state').textContent = 'Donations are not enabled. Replace and verify the placeholder details before accepting payments.';
}

// Displays funding explanations and only enables verified UPI details; takes a donation object, returns nothing.
function showDonation(donation) {
  resetDonationPanel();
  document.getElementById('donation-intro').textContent = donation.intro;
  document.getElementById('donation-note').textContent = donation.note;
  const funds = document.getElementById('donation-funds');
  funds.replaceChildren();
  for (const purpose of donation.funds) {
    funds.append(communityElement('li', '', purpose));
  }
  const qr = communityImage(donation.qrImage);
  const valid = donation.verified === true && /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(donation.upiId) && qr &&
    typeof donation.recipientName === 'string' && donation.recipientName.trim();
  if (valid) {
    const image = document.getElementById('upi-qr');
    image.src = qr;
    image.alt = 'UPI donation QR for ' + donation.recipientName + '; verify the recipient in your payment app';
    document.getElementById('upi-id').textContent = donation.upiId;
    document.getElementById('upi-recipient').textContent = 'Expected recipient: ' + donation.recipientName;
    document.getElementById('donation-state').textContent = 'Check the recipient name in your UPI app before confirming any payment.';
    // Hides the payment panel if its required QR cannot load; input: error event, output: no value.
    image.addEventListener('error', function hideBrokenQr() {
      document.getElementById('upi-id').textContent = 'UPI ID unavailable';
      document.getElementById('donation-state').textContent = 'Donation QR unavailable. Please contact the team before paying.';
      image.src = 'assets/upi-placeholder.svg';
    }, { once: true });
  }
}

// Loads verified social links for the About page; returns nothing, uses labels for missing URLs.
async function loadCommunityLinks() {
  const container = document.getElementById('community-socials');
  if (!container) {
    return;
  }
  try {
    const data = await readData('data/links.json');
    container.replaceChildren();
    for (const link of data.items) {
      const address = ticketAddress(link.url);
      const node = communityElement(address ? 'a' : 'span', address ? 'button button-outline' : 'placeholder-link', link.label + (address ? ' ↗' : ' · link coming soon'));
      if (address) {
        node.href = address;
      }
      addSocialIcon(node, link.label);
      container.append(node);
    }
  } catch {
    container.textContent = 'Community links could not load. Refresh to retry.';
  }
}

// Renders credited showcase entries by category; input: JSON items, output: cards or an honest empty state.
// Text stays literal and image paths reuse the local-only validator to protect visitors from injected markup.
function showShowcase(items) {
  for (const category of ['winners', 'artwork', 'highlights']) {
    const grid = document.getElementById('showcase-' + category);
    grid.replaceChildren();
    for (const item of items.filter(entry => entry.category === category)) {
      const card = communityElement('article', 'catalogue-card showcase-card', '');
      const placeholder = communityElement('p', 'showcase-placeholder', 'Image to be added');
      const photo = communityImage(item.image);
      if (photo && item.alt && Number.isInteger(item.width) && item.width > 0 && Number.isInteger(item.height) && item.height > 0) {
        const image = document.createElement('img');
        image.src = photo;
        image.alt = item.alt;
        image.width = item.width;
        image.height = item.height;
        image.loading = 'lazy';
        image.decoding = 'async';
        // Replaces a failed download with readable feedback; input: error event, output: no value.
        image.addEventListener('error', function missingShowcaseImage() {
          placeholder.textContent = 'Image unavailable';
          image.replaceWith(placeholder);
        }, { once: true });
        card.append(image);
      } else {
        card.append(placeholder);
      }
      if (item.sample) {
        card.append(communityElement('p', 'eyebrow', 'EDITABLE SAMPLE'));
      }
      card.append(communityElement('h3', '', item.title), communityElement('p', 'role-label', item.creator), communityElement('p', '', item.detail));
      grid.append(card);
    }
    if (!grid.children.length) {
      grid.append(communityElement('p', '', 'Our next community spotlight is on its way.'));
    }
  }
}

// Loads this page's content; errors show a retry action while forms and navigation remain available.
async function loadCommunityPage() {
  const status = document.getElementById('community-status');
  const retry = document.getElementById('retry-community');
  retry.disabled = true;
  if (document.getElementById('donation-intro')) {
    resetDonationPanel();
  }
  try {
    if (document.getElementById('showcase-winners')) {
      const showcase = await readData('data/showcase.json');
      showShowcase(showcase.items);
    } else if (document.getElementById('volunteer-grid')) {
      const volunteers = await readData('data/volunteers.json');
      showVolunteers(volunteers.items);
    } else {
      showCommunity(await readData('data/community.json'));
    }
    status.textContent = '';
    retry.hidden = true;
  } catch {
    status.textContent = 'Community details could not load. Check your connection and retry.';
    retry.hidden = false;
  } finally {
    retry.disabled = false;
  }
}

document.getElementById('retry-community').addEventListener('click', loadCommunityPage);
loadCommunityPage();
loadCommunityLinks();
