// Purpose: populate community photo panels from editable JSON using small responsive image copies.
'use strict';

// Loads photo records and fills matching data-photo figures; returns nothing, hides failed panels.
async function loadPhotos() {
  try {
    const data = await readData('data/photos.json');
    for (const figure of document.querySelectorAll('[data-photo]')) {
      const photo = data.items.find(item => item.id === figure.dataset.photo);
      if (!photo) {
        figure.hidden = true;
        continue;
      }
      const image = figure.querySelector('img');
      image.alt = photo.alt;
      image.width = photo.width;
      image.height = photo.height;
      image.src = photo.src;
      image.srcset = photo.small + ' 480w, ' + photo.src + ' 960w';
      figure.querySelector('figcaption').textContent = photo.caption;
    }
  } catch {
    // Photos enhance the page; hiding an unavailable panel leaves all main actions usable.
    for (const figure of document.querySelectorAll('[data-photo]')) {
      figure.hidden = true;
    }
  }
}

loadPhotos();
