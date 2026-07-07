
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
