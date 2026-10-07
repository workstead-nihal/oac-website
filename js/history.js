// Purpose: render OAC's branching history from editable JSON, from its founding date to today in India.
'use strict';

// Returns valid milestones in date order, plus labelled undated samples; inputs: items/start/today, output: copied array.
// Future entries are excluded so a history timeline does not present planned events as completed achievements.
function historyMilestones(items, start, today) {
  return items.filter(item => {
    if (!item.date) {
      return item.sample === true;
    }
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Number.isFinite(Date.parse(item.date)) &&
      new Date(item.date).toISOString().slice(0, 10) === item.date;
    return valid && item.date >= start && item.date <= today;
  }).sort((first, second) => (first.date || '9999').localeCompare(second.date || '9999'));
}

// Converts a YYYY-MM-DD value to a readable India date; input: date string, output: display text.
function historyDate(date) {
  return new Date(date + 'T00:00:00+05:30').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
  });
}

// Creates one literal-text element; inputs: tag/class/text, output: element without interpreting editable markup.
function historyElement(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

// Draws chronological branches and endpoints; inputs: history JSON and today's India date, output: no value.
// ponytail: equally spaced branches keep cards readable; use proportional dates only if the team needs that view.
function showHistory(data, today) {
  const list = document.getElementById('history-milestones');
  list.replaceChildren();
  const start = document.getElementById('history-start');
  start.textContent = historyDate(data.startDate);
  start.dateTime = data.startDate;
  const end = document.getElementById('history-today');
  end.textContent = 'Today · ' + historyDate(today);
  end.dateTime = today;
  const milestones = historyMilestones(data.items, data.startDate, today);
  for (const milestone of milestones) {
    const branch = historyElement('li', 'history-branch', '');
    const card = historyElement('article', 'catalogue-card history-card', '');
    const date = historyElement(milestone.date ? 'time' : 'p', 'eyebrow', milestone.sample ? 'LAYOUT SAMPLE' : historyDate(milestone.date));
    if (milestone.date) {
      date.dateTime = milestone.date;
    }
    card.append(date, historyElement('h3', '', milestone.title), historyElement('p', '', milestone.description));
    branch.append(card);
    list.append(branch);
  }
  document.getElementById('history-note').textContent = milestones.some(item => item.sample) ? 'The founding date is confirmed. Branch cards marked layout sample await your real events and achievements.' : 'Our community story, one milestone at a time.';
  if (!milestones.length) {
    document.getElementById('history-note').textContent = 'Our story began on ' + historyDate(data.startDate) + '. More milestones will be added by the team.';
  }
}

// Loads history with a retryable error; takes no inputs, updates the present day on each page load.
async function loadHistory() {
  const status = document.getElementById('history-status');
  const retry = document.getElementById('retry-history');
  retry.disabled = true;
  try {
    const data = await readData('data/history.json');
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    showHistory(data, today);
    status.textContent = '';
    retry.hidden = true;
  } catch {
    status.textContent = 'Our timeline could not load. Check your connection and retry.';
    retry.hidden = false;
  } finally {
    retry.disabled = false;
  }
}

document.getElementById('retry-history').addEventListener('click', loadHistory);
loadHistory();
