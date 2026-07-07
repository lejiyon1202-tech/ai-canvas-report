
import { displayScenario, makeCollapsible } from './utils.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('ko-KR');

const TYPE_LABEL = {
  roleplay: '롤플레잉', inbasket: '인바스켓',
  diagnosis_self: '진단 (자기평가)', diagnosis_ai: '진단 (AI)',
  presentation: '프레젠테이션', utterance_log: '대화·음성 기록',
};
const TYPE_ICON = {
  roleplay: '🎭', inbasket: '📥', diagnosis_self: '📋', diagnosis_ai: '🤖', presentation: '🎤',
};

async function j(url) { return (await fetch(url.replace('/api/', 'api/') + '.json')).json(); }

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function palette() {
  return {
    indigo: cssVar('--indigo'), sky: cssVar('--sky'), green: cssVar('--green'),
    amber: cssVar('--amber'), violet: cssVar('--violet'), navy: cssVar('--navy'),
    muted: cssVar('--muted'), border: cssVar('--border'), slate: cssVar('--slate-400'),
  };
}
const CHART_FONT = { family: "'Pretendard', 'Malgun Gothic', sans-serif", size: 12 };

const NON_ORG_LABELS = new Set(["사내 AX 프로그램"]);

function miniRow(label, sub, pct, tail) {
  return `<div class="mini-row"><span class="mini-label">${esc(label)}${sub ? ` <small>${esc(sub)}</small>` : ''}</span>
    <span class="mini-bar"><span style="width:${Math.min(pct, 100)}%"></span></span>
    <span class="mini-val">${tail}</span></div>`;
}

async function init() {
  const [summary, overview, growth, quality, gap, topics, refl,
         parallel, timeline, linkage, benchmark, insights] = await Promise.all([
    j('/api/summary'), j('/api/overview'), j('/api/growth'), j('/api/quality'),
    j('/api/gap'), j('/api/topic-effect'), j('/api/reflections'),
    j('/api/parallel-orgs'), j('/api/timeline'), j('/api/linkage'),
    j('/api/benchmark'), j('/api/insights'),
  ]);

  const u = overview.usage;
  document.getElementById('ex-orgs').textContent = `${u.orgs}개사`;
  document.getElementById('ex-projects').textContent = `${u.projects}개`;
  document.getElementById('ex-learners').textContent = `${fmt(u.learners)}명`;
  document.getElementById('ex-learners-sub').textContent = `(평가 완료 ${fmt(u.learners_evaluated)}명)`;
  document.getElementById('ex-records').textContent = `${fmt(u.records)}건`;
  const aiItems = summary.solutions
    .filter(s => s.evaluator_type === 'ai')
    .reduce((acc, s) => acc + s.records, 0);
  document.getElementById('ex-ai-items').textContent = `(이 중 AI 채점 ${fmt(aiItems)}개 항목)`;
  document.getElementById('ex-period').textContent =
    `실 운영 데이터 기준 · ${u.orgs}개사 ${u.projects}개 과정`;

  const topG = growth.delta_by_org_competency.top[0];
  const opsK = quality.kappa?.ops;
  const lkR = linkage.a_self_vs_ai;
  document.getElementById('ex-exec-summary').innerHTML = `
    <ul class="summary-list">
      <li><strong>${u.orgs}개사 · ${u.projects}개 과정 · 참여 학습자 ${fmt(u.learners)}명</strong> — 평가 데이터 ${fmt(u.records)}건의 실 운영 실적</li>
      <li>2개 과정 이상 재도입 기업 <strong>${overview.readoption.filter(r => !NON_ORG_LABELS.has(r.org_name)).length}개사</strong> — 도입이 추가 과정으로 이어짐</li>
      <li>사전→사후 역량 단위 최대 <strong>+${topG.delta_pct}%p</strong> 상승 <em>(자기평가)</em></li>
      <li>채점 일관성 <strong>κ ${opsK ? Math.round(opsK.weighted_kappa * 100) / 100 : '—'}</strong> — 같은 답변을 두 번 채점해도 ±10점 이내 일치 ${opsK ? Math.round(opsK.within10_pct * 1000) / 10 : '—'}% <em>(운영 채점기 · 유효 ${opsK ? fmt(opsK.pairs) : '—'}쌍)</em></li>
      <li>자기평가와 실제 행동(AI 채점)은 <strong>통계적으로 거의 무관</strong> <em>(상관계수 ${Math.round(lkR.pearson_r * 100) / 100})</em> → 행동 기반 평가 보완 필요</li>
    </ul>
    <div class="summary-note">상세 수치·해석 조건은 각 탭의 각주 참조</div>`;

  const at = quality.attempt_stats;
  if (at) {
    document.getElementById('ex-attempts').innerHTML = [
      [fmt(at.sessions) + '회', '평가 리포트 생성'],
      [at.per_learner + '회', '학습자당 평균 응시'],
      [at.axes_per_session + '개', '리포트당 채점 역량 축'],
    ].map(([num, label]) => `
      <div class="attempt-card"><div class="attempt-num">${num}</div><div class="attempt-label">${label}</div></div>`).join('');
    document.getElementById('ex-attempts-note').textContent = at.note;
  }

  const mainTypes = overview.by_type
    .filter(t => t.solution_type !== 'utterance_log' && t.participants != null && t.participants >= 3);
  const tinyTypes = overview.by_type
    .filter(t => t.solution_type !== 'utterance_log' && t.participants != null && t.participants < 3);
  document.getElementById('ex-types').innerHTML = mainTypes.map(t => `
      <div class="type-card">
        <div class="type-icon">${TYPE_ICON[t.solution_type] || '📊'}</div>
        <div class="type-name">${esc(TYPE_LABEL[t.solution_type] || t.solution_type)}</div>
        <div class="type-num">${fmt(t.participants)}명</div>
        <div class="type-sub">참여 (평가 완료 ${fmt(t.evaluated)}명)</div>
        <div class="type-meta">${t.projects}개 과정 · ${t.orgs}개사</div>
      </div>`).join('')
    + (tinyTypes.length ? `<div class="type-footnote">※ ${tinyTypes.map(t =>
        `${esc(TYPE_LABEL[t.solution_type] || t.solution_type)} ${fmt(t.participants)}명`).join(' · ')} — 참여 인원이 적어 카드 없이 표기</div>` : '');

  const eff = overview.records_by_eff_type || [];
  const donutPal = [palette().indigo, palette().amber, palette().green, palette().violet, palette().sky];
  new Chart(document.getElementById('chart-type-donut'), {
    type: 'doughnut',
    data: {
      labels: eff.map(t => TYPE_LABEL[t.eff_type] || t.eff_type),
      datasets: [{ data: eff.map(t => t.records), backgroundColor: donutPal, borderWidth: 2 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '58%',
      plugins: {
        legend: { position: 'right', labels: { font: CHART_FONT, boxWidth: 14 } },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${fmt(c.parsed)}건` } },
      },
    },
  });

  const maxProj = overview.readoption[0]?.projects || 1;
  const readoptOrgs = overview.readoption.filter(r => !NON_ORG_LABELS.has(r.org_name)).length;
  document.getElementById('ex-readopt').innerHTML = overview.readoption.slice(0, 8).map(r =>
    miniRow(NON_ORG_LABELS.has(r.org_name) ? `${r.org_name} (프로그램)` : r.org_name,
      `${r.solution_types}개 유형`, r.projects / maxProj * 100, `${r.projects}개 과정`)).join('')
    + `<div class="panel-note">2개 과정 이상 도입 기업 ${readoptOrgs}개사 (프로그램 단위 제외) — 도입 후 추가 과정으로 이어진 고객</div>`;

  const combos = overview.multi_combos || [];
  const maxCombo = combos[0]?.learners || 1;
  const comboLabel = c => c.split(',').map(t => TYPE_LABEL[t] || t).join(' + ');
  document.getElementById('ex-combos').innerHTML = combos.map(c =>
    miniRow(comboLabel(c.combo), '', c.learners / maxCombo * 100, `${fmt(c.learners)}명`)).join('')
    + `<div class="panel-note">복수 유형 참여 학습자 ${fmt(combos.reduce((a, c) => a + c.learners, 0))}명 — 재도입(과정 단위 집계)과는 다른, 학습자 단위 기준입니다</div>`;

  const orgTopics = overview.topics.org_top_scenarios || [];
  const maxOT = orgTopics[0]?.learners || 1;
  document.getElementById('ex-org-topics').innerHTML = orgTopics.map(o =>
    miniRow(o.org_name, o.scenario, o.learners / maxOT * 100, `${fmt(o.learners)}명`)).join('')
    + `<div class="panel-note">기업별 최다 참여 시나리오 (학습자 5명 이상 기준)</div>`;

  const pOrgs = parallel.parallel.orgs.map(o => esc(o.org_name)).join(' · ');
  const lkGroups = linkage.b_parallel_vs_only.groups;
  const gPar = lkGroups.find(g => g.grp === 'parallel');
  const gOnly = lkGroups.find(g => g.grp === 'practice_only');
  const lPar = Math.round(gPar.avg_ai_score * 1000) / 10;
  const lOnly = Math.round(gOnly.avg_ai_score * 1000) / 10;
  document.getElementById('ex-parallel').innerHTML = `
    <div class="parallel-nums">
      <div><span class="p-big">${parallel.parallel.group_avg_pct}%</span><span class="p-label">병행 도입 기업 평균 (${pOrgs})</span></div>
      <div><span class="p-big">${parallel.practice_only.group_avg_pct}%</span><span class="p-label">실습 단독 기업 평균 (${parallel.practice_only.orgs.length}개사)</span></div>
    </div>
    <div class="panel-note">기업별 평균을 같은 비중으로 평균하면 차이는 +${Math.round((parallel.parallel.group_avg_pct - parallel.practice_only.group_avg_pct) * 10) / 10}%p이고,
      학습자 단위로는 병행 참여자 ${lPar}%(${fmt(gPar.learners)}명) vs 실습 단독 ${lOnly}%(${fmt(gOnly.learners)}명)로
      <strong>+${Math.round((lPar - lOnly) * 10) / 10}%p</strong> 차이입니다.
      ⚠ 다만 학습자 단위 차이에는 병행 도입 기업의 구성 특성이 반영됐을 수 있고
      (병행 기업 ${parallel.parallel.orgs.length}개사 소표본), 인과 관계로 해석할 수 없습니다.</div>`;

  const months = timeline.monthly || [];
  const pal = palette();
  new Chart(document.getElementById('chart-timeline-exec'), {
    type: 'line',
    data: {
      labels: months.map(m => String(m.month)),
      datasets: [{
        label: '평가·활동 건수', data: months.map(m => m.records),
        borderColor: pal.indigo, backgroundColor: pal.indigo + '22',
        fill: true, tension: 0.35, pointBackgroundColor: pal.indigo, pointRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { font: CHART_FONT } }, x: { ticks: { font: CHART_FONT } } },
    },
  });
  document.getElementById('ex-timeline-note').textContent =
    `실습 계열(롤플레잉·인바스켓·대화 기록) 기준 — 진단은 평가 일시가 기록되지 않은 경우가 많아 추이에서 제외했으며, 날짜 정보가 없는 ${fmt(timeline.unknown_records)}건도 포함하지 않았습니다`;

  const pop = overview.topics.roleplay_scenarios.slice(0, 8);
  const maxPop = pop[0]?.learners || 1;
  document.getElementById('ex-popular-topics').innerHTML = pop.map(s =>
    miniRow(displayScenario(s.scenario), `${s.orgs}개사`, s.learners / maxPop * 100, `${fmt(s.learners)}명`)).join('');

  document.getElementById('ex-topics').innerHTML = topics.topics.map(t =>
    miniRow(t.topic, `${fmt(t.records)}건`, t.avg_pct, `${t.avg_pct}%`)).join('');
  document.getElementById('ex-topics-note').textContent =
    `시나리오 이름이 기록된 데이터만 집계 (전체의 약 ${Math.round((100 - topics.meta.scenario_missing_pct) * 10) / 10}%) · 참여가 적은 ${topics.meta.excluded_small}개 주제는 제외 · 주제 간 점수 차는 난이도 영향을 포함하므로 우열을 가리는 자료가 아닙니다`;

  document.getElementById('ex-topic-cross').innerHTML = (topics.topic_categories || []).map(t => `
    <div class="topic-cross-row">
      <div class="cross-topic">${esc(t.topic)}</div>
      <div class="cross-cats">${t.categories.map(c =>
        `${esc(c.category)} ${c.avg_pct}% <small>(${fmt(c.n)}건)</small>`).join(' · ')}</div>
    </div>`).join('');

  const top = growth.delta_by_org_competency.top[0];
  document.getElementById('ex-growth').innerHTML = `
    <div class="effect-head">사전 → 사후 향상</div>
    <div class="effect-big">+${top.delta_pct}%p</div>
    <div class="effect-desc">역량 단위 최대 상승 (${esc(top.category)} · 사전/사후 각 ${fmt(top.pre_n)}건 응답)</div>
    <div class="effect-bar"><span style="width:${Math.round(top.pre_avg * 100)}%" class="bar-pre"></span></div>
    <div class="effect-bar"><span style="width:${Math.round(top.post_avg * 100)}%" class="bar-post"></span></div>
    <div class="effect-legend">사전 ${Math.round(top.pre_avg * 1000) / 10}% → 사후 ${Math.round(top.post_avg * 1000) / 10}% <small>(향상 폭은 반올림 전 원값 기준)</small></div>`;
  const ops = quality.kappa?.ops;
  if (ops) {
    const within = Math.round(ops.within10_pct * 1000) / 10;
    document.getElementById('ex-kappa').innerHTML = `
      <div class="effect-head">채점 일관성</div>
      <div class="kappa-layout">
        <div class="canvas-wrap canvas-wrap--gauge"><canvas id="chart-kappa"></canvas></div>
        <div>
          <div class="effect-big">κ ${Math.round(ops.weighted_kappa * 100) / 100}</div>
          <div class="effect-desc">같은 답변을 두 번 채점해도 ±10점 내 일치 ${within}%</div>
          <div class="effect-note">운영 채점기 기준 · 유효 ${fmt(ops.pairs)}쌍을 독립적으로 두 번 채점</div>
          <div class="effect-note">이중 검증: 상급 모델 표준 루브릭 κ ${quality.kappa.all ? Math.round(quality.kappa.all.weighted_kappa * 100) / 100 : '—'} 별도 산출 — 두 κ는 표본·척도·루브릭이 달라 서로 비교할 수 없습니다</div>
        </div>
      </div>`;

    new Chart(document.getElementById('chart-kappa'), {
      type: 'doughnut',
      data: { labels: ['±10점 내 일치', '이탈'],
        datasets: [{ data: [within, Math.max(0, 100 - within)],
          backgroundColor: [palette().green, palette().border], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed}%` } } } },
    });
  } else {
    document.getElementById('ex-kappa').innerHTML = '';
  }

  const gtop = growth.delta_by_org_competency.top.slice(0, 8);
  new Chart(document.getElementById('chart-dumbbell'), {
    type: 'bar',
    data: {
      labels: gtop.map(r => `${r.org_name} · ${r.std_name}`),
      datasets: [{
        label: '사전 → 사후 (%)',
        data: gtop.map(r => [Math.round(r.pre_avg * 100), Math.round(r.post_avg * 100)]),
        backgroundColor: palette().green + 'cc', borderColor: palette().green,
        borderWidth: 1, borderSkipped: false, barThickness: 14, borderRadius: 7,
      }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: c => ` 사전 ${c.raw[0]}% → 사후 ${c.raw[1]}% (+${gtop[c.dataIndex].delta_pct}%p)` } } },
      scales: { x: { min: 0, max: 100, ticks: { font: CHART_FONT, callback: v => v + '%' } },
                y: { ticks: { font: CHART_FONT } } },
    },
  });
  document.getElementById('ex-growth-note').textContent =
    '자기평가 사전/사후 (사후 응답자 기준 — 인식 변화 지표) · 사전/사후 각 30건 이상인 기업×역량만 표시';

  const radarOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, font: { ...CHART_FONT, size: 10 } },
                   pointLabels: { font: CHART_FONT } } },
  };
  new Chart(document.getElementById('chart-radar-ai'), {
    type: 'radar',
    data: { labels: gap.by_category.map(c => c.category),
      datasets: [{ label: 'AI 채점 평균', data: gap.by_category.map(c => c.avg_pct),
        borderColor: palette().indigo, backgroundColor: palette().indigo + '33',
        pointBackgroundColor: palette().indigo }] },
    options: radarOpts,
  });
  const selfComp = insights.a_competency?.self;
  if (selfComp) {
    const selfList = [...selfComp.strongest, ...selfComp.weakest];
    new Chart(document.getElementById('chart-radar-self'), {
      type: 'radar',
      data: { labels: selfList.map(c => c.name),
        datasets: [{ label: '자기평가 평균', data: selfList.map(c => c.avg_pct),
          borderColor: palette().amber, backgroundColor: palette().amber + '33',
          pointBackgroundColor: palette().amber }] },
      options: radarOpts,
    });
  }
  document.getElementById('ex-comp-note').textContent =
    'AI 채점(행동 기반)과 자기평가(응답 기반)는 척도가 달라 두 패널의 수치를 직접 비교할 수 없습니다 · 역량 간 점수 차는 난이도 영향 포함';

  const weakest = (gap.weakest_competencies || []).filter(c => c.learners >= 10);
  document.getElementById('ex-gap-detail').innerHTML = weakest.map(c =>
    miniRow(c.std_name, `${c.category} · ${fmt(c.learners)}명`, c.avg_pct, `${c.avg_pct}%`)).join('')
    + `<div class="panel-note">평균이 낮은 역량 = 교육 수요 신호 (난이도 영향을 포함하므로 서열을 가리는 자료가 아닙니다 · 평가 30건·참여 10명 이상 기준)</div>`;

  const lk = linkage.a_self_vs_ai;
  document.getElementById('ex-linkage').innerHTML = `
    <div class="callout-head">자기평가와 AI 채점(행동 기반)은 상관을 보이지 않았습니다</div>
    <div class="callout-big">r = ${lk.pearson_r}</div>
    <div class="callout-body">진단(자기평가)과 실습(AI 채점)을 모두 거친 학습자 ${fmt(lk.n)}명에서,
      스스로 매긴 점수와 실제 대화 행동에 대한 채점 사이에 의미 있는 상관이 나타나지 않았습니다.
      <strong>자기 인식과 실제 행동이 다를 수 있다</strong>는 신호로, 자기보고식 진단만으로는 한계가 있어
      행동 기반 측정(실습 채점)의 보완이 필요함을 시사합니다.</div>
    <div class="callout-note">${fmt(lk.n)}명 소표본 · 측정 방식이 다른 두 점수의 참고 지표 · 인과 관계 아님</div>`;

  new Chart(document.getElementById('chart-scatter-linkage'), {
    type: 'scatter',
    data: { datasets: [{
      label: '학습자',
      data: (lk.scatter || []).map(s => ({ x: s.self, y: s.ai })),
      backgroundColor: palette().sky + 'b3', pointRadius: 5, pointHoverRadius: 7,
    }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: c => ` 자기평가 ${c.parsed.x}% · AI 채점 ${c.parsed.y}%` } } },
      scales: {
        x: { title: { display: true, text: '자기평가 평균 (%)', font: CHART_FONT }, min: 0, max: 100, ticks: { font: CHART_FONT } },
        y: { title: { display: true, text: 'AI 채점 평균 (%)', font: CHART_FONT }, min: 0, max: 100, ticks: { font: CHART_FONT } },
      },
    },
  });

  const bmOrgs = benchmark.orgs || [];
  new Chart(document.getElementById('chart-benchmark'), {
    type: 'scatter',
    data: { datasets: [{
      label: '기업 평균',
      data: bmOrgs.map((o, i) => ({ x: o.avg_pct, y: i })),
      backgroundColor: palette().violet, pointRadius: 7, pointStyle: 'circle',
    }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${bmOrgs[c.dataIndex].org_name}: ${c.parsed.x}% (${fmt(bmOrgs[c.dataIndex].n)}건)` } } },
      scales: {
        x: { min: 0, max: 100, title: { display: true, text: 'AI 채점 평균 (%)', font: CHART_FONT }, ticks: { font: CHART_FONT } },
        y: { reverse: true, ticks: { font: CHART_FONT, stepSize: 1, autoSkip: false,
             callback: v => bmOrgs[v] ? bmOrgs[v].org_name : '' } },
      },
    },
  });
  document.getElementById('ex-benchmark-note').textContent =
    `${benchmark.note} · 기업 간 점수 차는 과정·시나리오 난이도 영향을 포함하므로 서열을 가리는 자료가 아닙니다`;

  const themes = (refl.themes?.list || refl.themes || []).slice(0, 9);
  document.getElementById('ex-themes').innerHTML = themes.map(t => `
    <div class="theme-chip"><span class="theme-name">${esc(t.theme || t.name)}</span>
      <span class="theme-count">${fmt(t.n ?? t.count)}건</span></div>`).join('');

  const phrases = (refl.phrases?.list || []).slice(0, 6);
  document.getElementById('ex-phrases').innerHTML = phrases.map(ph => `
    <div class="phrase-item">
      <span class="phrase-term">"${esc(ph.phrase || ph.term)}" <small>${fmt(ph.n ?? ph.count)}회</small></span>
      <div class="phrase-example">${esc((ph.examples && ph.examples[0]) || ph.example || '')}</div>
    </div>`).join('');

  const quotes = (refl.quotes?.list || []).slice(0, 8);
  document.getElementById('ex-quotes').innerHTML = quotes.map(q => `
    <div class="voice-card">
      <div class="voice-text">"${esc(q.text)}"</div>
      <div class="voice-meta">— 학습자 자필 성찰 (익명)</div>
    </div>`).join('');

  const testExcluded = quality.total_raw - quality.non_test;
  document.getElementById('ex-quality-narrative').innerHTML = `
    <p>본 보고서의 모든 수치는 실 운영 데이터에서 산출했습니다. 원자료 ${fmt(quality.total_raw)}건 중
    테스트 계정 ${fmt(testExcluded)}건을 제외한 <strong>${fmt(quality.non_test)}건</strong>이 집계 대상이며,
    이 중 점수가 산출된 데이터는 ${fmt(quality.analyzable)}건(${quality.analyzable_pct}%)입니다.</p>
    <p>신원이 확인되지 않는 참여 기록은 학습자 수에 넣지 않았고, 척도를 확정할 수 없는 점수는 평균에서
    제외했습니다. 채점 신뢰성은 같은 답변을 독립적으로 두 번 채점하는 방식(일관성 κ)으로 검증했으며, 모든 화면 수치는
    원천 데이터와 자동 대조되는 구조로 관리됩니다.</p>`;
  document.getElementById('ex-quality').textContent =
    `집계 기준: 테스트 제외 ${fmt(quality.non_test)}건 · 점수 보유 ${fmt(quality.analyzable)}건 · 신원 확인 학습자 ${fmt(u.learners)}명`;

  document.getElementById('ex-roadmap').innerHTML = `
    <p>데이터 품질을 한 단계 더 올리기 위해 수집 단계 표준화 5건을 플랫폼에 <strong>요청해 둔 상태</strong>입니다 (반영 확정 아님):</p>
    <ol class="roadmap-list">
      <li><strong>평가 일시 자동 기록</strong> — 반영 시 진단 포함 전 과정의 시계열·향상 추적이 완전해집니다</li>
      <li><strong>시나리오 식별자 자동 기록</strong> — 주제별 효과 분석 모수가 2배 이상 확대됩니다</li>
      <li><strong>학습 성찰 표준 수집</strong> — "학습자의 목소리" 커버리지가 현행 5.3%에서 크게 늘어납니다</li>
      <li><strong>부서 선택형 표준화</strong> — 부서 단위 비교 분석이 가능해집니다</li>
      <li><strong>학습자 불변 식별자</strong> — 과정 간 성장 추적 정확도가 오르고 개인정보 취급은 줄어듭니다</li>
    </ol>`;

  document.getElementById('ex-footnotes').innerHTML = [
    '향상도는 자기평가 사전/사후 결과로, 사후 응답자 기준의 인식 변화 지표입니다',
    `채점 일관성 κ는 운영 채점기 기준(유효 ${ops ? fmt(ops.pairs) : '—'}쌍)이며, 상급 모델 κ는 표준 루브릭으로 별도 측정한 값입니다`,
    '학습자 수는 신원이 확인된 학습자 기준이며(익명 참여 제외), 참여자와 평가 완료자를 구분해 표기했습니다',
    '역량·주제·기업 간 점수 차는 난이도 영향을 포함하므로 우열이나 서열을 가리는 자료가 아닙니다',
    '병행 도입 효과는 연관성 지표이며 인과 관계가 아닙니다',
    '기업명은 익명 처리했습니다 (A사·B사…) — 원본 대응표는 내부 관리',
  ].map((f, i) => `<div>${i + 1}. ${esc(f)}</div>`).join('');

  ['ex-popular-topics', 'ex-topics', 'ex-topic-cross', 'ex-readopt', 'ex-combos',
   'ex-org-topics', 'ex-gap-detail', 'ex-quotes', 'ex-phrases', 'ex-themes']
    .forEach(id => makeCollapsible(document.getElementById(id)));
}

document.querySelectorAll('#exec-tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#exec-tabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-content').forEach(p =>
      p.classList.toggle('active', p.id === `tab-${btn.dataset.tab}`));

    requestAnimationFrame(() => {
      document.querySelectorAll(`#tab-${btn.dataset.tab} canvas`).forEach(c => {
        const ch = window.Chart && Chart.getChart(c);
        if (ch) ch.resize();
      });
    });
  });
});

document.getElementById('exec-print-btn').addEventListener('click', () => window.print());
init().catch(e => console.error('[report-exec]', e));
