// Purpose: render four enquiry cards and their labelled fields from editable JSON; reuse the shared submission flow.
'use strict';

// Loads the hub or selected form; no inputs, fills local content and exposes retry on errors.
async function loadWork() {
  const status = document.getElementById('work-status');
  const retry = document.getElementById('retry-work');
  retry.disabled = true;
  try {
    const data = await readData('data/work.json');
    const cards = document.getElementById('work-cards');
    if (cards) {
      cards.replaceChildren();
      for (const form of data.forms) {
        const card = document.createElement('article');
        card.className = 'catalogue-card';
        const title = document.createElement('h2');
        title.textContent = form.title;
        const description = document.createElement('p');
        description.textContent = form.description;
        const link = document.createElement('a');
        link.className = 'button';
        if (!['stall', 'sponsor', 'partnership', 'creator'].includes(form.action)) {
          throw new Error('Unknown form');
        }
        link.href = 'work-' + form.action + '.html';
        link.textContent = 'Apply · ' + form.title;
        card.append(title, description, link);
        cards.append(card);
      }
    } else {
      const form = data.forms.find(item => item.action === communityForm.dataset.action);
      const fields = document.getElementById('work-fields');
      fields.replaceChildren();
      for (const field of form.fields) {
        const wrapper = document.createElement('div');
        const label = document.createElement('label');
        label.htmlFor = 'work-' + field.name;
        label.textContent = field.label;
        const input = document.createElement(field.type === 'select' ? 'select' : field.type === 'textarea' ? 'textarea' : 'input');
        input.id = label.htmlFor;
        input.name = field.name;
        input.required = true;
        if (field.type === 'select') {
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.textContent = 'Choose an option';
          input.append(placeholder);
          for (const value of field.options) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            input.append(option);
          }
        } else {
          input.maxLength = field.max;
          if (field.type === 'textarea') {
            input.rows = 4;
          } else {
            input.type = field.type;
          }
        }
        wrapper.append(label, input);
        fields.append(wrapper);
      }
      document.getElementById('form-fields').disabled = false;
      submitButton.disabled = false;
    }
    status.textContent = '';
    retry.hidden = true;
  } catch {
    status.textContent = 'Could not load this content. Check your connection and retry; no enquiry has been sent.';
    retry.hidden = false;
  } finally {
    retry.disabled = false;
  }
}

document.getElementById('retry-work').addEventListener('click', loadWork);
loadWork();
