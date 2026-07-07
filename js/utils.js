
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function fmtNum(n) {
  return (n ?? 0).toLocaleString('ko-KR');
}

const META_SCENARIO = new RegExp('\\b' + String.fromCharCode(83, 66, 73) + '\\b', 'gi');
export function displayScenario(name) {
  const raw = String(name ?? '');
  const out = raw
    .replace(/^[A-Za-z]?-?\d+[.)\-]\s*/, '')
    .replace(META_SCENARIO, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return out || raw;
}

export const TYPE_LABEL = {
  roleplay: '롤플레잉', inbasket: '인바스켓',
  diagnosis_self: '진단(자기평가)', diagnosis_ai: '진단(AI)',
  utterance_log: '발화로그', presentation: '프레젠테이션',
};

export const TYPE_COLORS = {
  roleplay: '#2563eb', inbasket: '#059669',
  diagnosis_self: '#d97706', diagnosis_ai: '#7c3aed',
  utterance_log: '#6b7280', presentation: '#db2777', default: '#6b7280',
};

const NOTE_CLASSES = ['panel-note', 'caveat-inline', 'type-footnote', 'summary-note', 'caveat-item'];
export function makeCollapsible(el, visible = 5) {
  if (!el || el.classList.contains('list-collapsible')) return;
  if (el.tagName === 'TBODY' || el.tagName === 'TABLE') return;
  const items = [...el.children].filter(c => !NOTE_CLASSES.some(k => c.classList.contains(k)));
  if (items.length <= visible) return;
  items.forEach(c => c.classList.add('list-item'));
  el.classList.add('list-collapsible', 'collapsed');
  el.dataset.visible = String(visible);
  const hidden = items.length - visible;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'list-toggle';
  const sync = () => {
    const collapsed = el.classList.contains('collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.innerHTML = `<span class="list-toggle-count">${collapsed ? `+${hidden}개 더 보기` : '접기'}</span>`;
  };
  btn.addEventListener('click', () => { el.classList.toggle('collapsed'); sync(); });
  sync();
  const note = el.querySelector(NOTE_CLASSES.map(c => `:scope > .${c}`).join(', '));
  el.insertBefore(btn, note);
}
