/** 공통 유틸 */
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

// 시나리오명 표시용 별칭 — "A-1."·"1." 류 접두 제거 (대장님 "지워" 확정 2026-07-06)
// DB 원본은 무수정 보존 — 화면 표시만 정규화
export function displayScenario(name) {
  return String(name ?? '').replace(/^[A-Za-z]?-?\d+[.)\-]\s*/, '').trim() || String(name ?? '');
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
