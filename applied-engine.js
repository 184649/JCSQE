/* v11 original-case engine. Pure functions except the explicitly passed profile. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JCSQEApplied = factory();
})(typeof window !== 'undefined' ? window : globalThis, function() {
'use strict';
const DAY = 86400000;
const clone = x => JSON.parse(JSON.stringify(x));
const validChoice = x => Number.isInteger(x) && x >= 0 && x < 4;
const normalized = x => String(x).normalize('NFKC').replace(/\s+/g, '');
function shuffle(values, random = Math.random) {
  const out = values.slice();
  for (let i = out.length - 1; i > 0; --i) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function bank(data) {
  const questions = data.questions || data;
  const ids = new Set(), texts = new Set();
  for (const q of questions) {
    if (!q.id || ids.has(q.id) || !q.topicKey || !q.chapter || !q.task ||
        !q.text || texts.has(normalized(q.text)) || !validChoice(q.correct) ||
        !Array.isArray(q.options) || q.options.length !== 4 ||
        new Set(q.options.map(normalized)).size !== 4 || q.options.some(x => !String(x).trim()) ||
        !Array.isArray(q.reasons) || q.reasons.length !== 4 || q.reasons.some(x => !x) ||
        !q.brief || !q.detail || !q.syllabus || !/^L[123]$/.test(q.level)) {
      throw new Error('問題データを確認してください: ' + (q.id || 'IDなし'));
    }
    ids.add(q.id); texts.add(normalized(q.text));
  }
  return {questions, byId: new Map(questions.map(q => [q.id, q])),
    topics: [...new Set(questions.map(q => q.topicKey))],
    chapters: [...new Set(questions.map(q => q.chapter))]};
}
function profile(p) {
  if (!p.appliedStudy) p.appliedStudy = {schema: 11, history: [], sessions: [], exposures: {}, bookmarks: [], active: null, serial: 0};
  const a = p.appliedStudy;
  if (a.schema !== 11 || !Array.isArray(a.history) || !Array.isArray(a.sessions) ||
      !a.exposures || typeof a.exposures !== 'object' || !Array.isArray(a.bookmarks)) {
    throw new Error('事例演習の保存形式を確認できません。元のデータは削除しないでください。');
  }
  return a;
}
function latest(p) {
  const out = new Map();
  for (const r of profile(p).history) if (r.observed !== false) out.set(r.questionId, r);
  return out;
}
function topicStatus(b, p, now = Date.now()) {
  const a = profile(p), result = new Map();
  for (const key of b.topics) {
    const hs = a.history.filter(h => b.byId.has(h.questionId) && h.topicKey === key && h.observed !== false).slice().sort((x, y) => x.at - y.at);
    const last = hs.at(-1);
    let evidence = [];
    for (const h of hs) {
      if (!h.correct || h.confidence !== 'sure') evidence = [];
      else if (!evidence.length || (h.at - evidence.at(-1).at >= 2 * DAY &&
        !evidence.some(e => e.questionId === h.questionId))) evidence.push(h);
    }
    const dueAt = !last ? null : last.at + ((!last.correct || last.confidence !== 'sure') ? 2 : 7) * DAY;
    result.set(key, {key, last, dueAt, due: dueAt !== null && now >= dueAt,
      weak: !!last && (!last.correct || last.confidence !== 'sure'),
      delayedEvidence: evidence.length, confirmedAcrossCases: evidence.length >= 2});
  }
  return result;
}
function seen(a, id) { return Object.prototype.hasOwnProperty.call(a.exposures, id) || a.history.some(h => h.questionId === id && h.observed !== false); }
function choose(b, p, options = {}, now = Date.now(), random = Math.random) {
  const a = profile(p), lm = latest(p), ts = topicStatus(b, p, now);
  const count = Math.max(1, Math.min(40, Math.trunc(Number(options.count) || 10)));
  const mode = options.mode || 'smart';
  const excluded = new Set(options.excludeIds || []);
  let pool = b.questions.filter(q => !excluded.has(q.id) && (!options.chapter || options.chapter === 'all' || q.chapter === options.chapter));
  if (options.topic && options.topic !== 'all') pool = pool.filter(q => q.topicKey === options.topic);
  if (mode === 'new') pool = pool.filter(q => !seen(a, q.id));
  if (mode === 'due') pool = pool.filter(q => ts.get(q.topicKey).due);
  if (mode === 'wrong') pool = pool.filter(q => ts.get(q.topicKey).weak);
  if (mode === 'bookmarks') pool = pool.filter(q => a.bookmarks.includes(q.id));
  if (!pool.length) return {items: [], warning: mode === 'due' ? '復習期日に達したテーマはありません。' : '条件に合う問題がありません。'};
  // A mock explicitly labelled "new" must never silently reuse old questions.
  if (options.kind === 'mock' && pool.length < 40) return {items: [], warning: `条件に合う問題は${pool.length}問です。初見40問として開始しません。復習を含む40問は別のボタンから選べます。`};
  // In default practice, do not repeat a just-read theme while enough alternatives exist.
  let eligible = pool;
  if (mode === 'smart') {
    const spaced = pool.filter(q => {
      const last = ts.get(q.topicKey).last;
      return !last || now - last.at >= 2 * DAY;
    });
    if (spaced.length >= count && new Set(spaced.map(q => q.topicKey)).size >= Math.min(count, 20)) eligible = spaced;
  }
  const selected = [], counts = new Map(), domains = new Map(), tasks = new Map();
  const keys = new Set(eligible.map(q => q.topicKey));
  const cap = Math.min(2, Math.max(1, Math.ceil(count / keys.size)));
  const remaining = shuffle(eligible, random);
  function rank(q) {
    const t = ts.get(q.topicKey), last = lm.get(q.id), fresh = !seen(a, q.id);
    if (mode === 'new') return 0;
    if (t.due && fresh) return -7; // Prefer another situation in the weak/due topic.
    if (fresh && !t.last) return -5;
    if (fresh) return -3;
    if (t.due && (!last || last.questionId !== t.last?.questionId)) return -2;
    if (last && now - last.at < 2 * DAY) return 12;
    return 4;
  }
  while (selected.length < count) {
    const candidates = remaining.filter(q => (counts.get(q.topicKey) || 0) < cap);
    if (!candidates.length) break;
    const prev = selected.at(-1)?.topicKey;
    const notAdjacent = candidates.filter(q => q.topicKey !== prev);
    const choices = notAdjacent.length ? notAdjacent : candidates;
    choices.sort((x, y) => {
      const score = q => rank(q) + 7 * (domains.get(q.chapter) || 0) +
        16 * (counts.get(q.topicKey) || 0) + 2 * (tasks.get(q.task) || 0);
      return score(x) - score(y);
    });
    const q = choices[0]; selected.push(q); remaining.splice(remaining.indexOf(q), 1);
    counts.set(q.topicKey, (counts.get(q.topicKey) || 0) + 1);
    domains.set(q.chapter, (domains.get(q.chapter) || 0) + 1);
    tasks.set(q.task, (tasks.get(q.task) || 0) + 1);
  }
  const repeats = selected.filter(q => seen(a, q.id)).length;
  const warnings = [];
  if (selected.length < count) warnings.push(`重複を埋め合わせず、${selected.length}問で開始します。`);
  if (repeats) warnings.push(`既に表示・回答した${repeats}問を含む復習です。`);
  if (cap > 1) warnings.push('同テーマは最大2問です。別の課題として出題します。');
  return {items: selected, warning: warnings.join(' ')};
}
function createSession(b, p, options = {}, now = Date.now(), random = Math.random) {
  const a = profile(p);
  if (a.active) throw new Error('途中の演習があります。再開するか、終了してから開始してください。');
  const selection = choose(b, p, options, now, random);
  if (!selection.items.length) return {session: null, warning: selection.warning};
  const qs = selection.items, serial = (Number(a.serial) || 0) + 1; a.serial = serial;
  const s = {schema: 11, id: `a11-${now}-${serial}`, kind: options.kind || 'practice',
    mode: options.mode || 'smart', index: 0, questionIds: qs.map(q => q.id),
    snapshots: Object.fromEntries(qs.map(q => [q.id, clone(q)])),
    orders: Object.fromEntries(qs.map(q => [q.id, shuffle([0, 1, 2, 3], random)])),
    answers: {}, confidence: {}, committed: {}, first: {}, observed: {}, spent: {},
    warning: selection.warning, startedAt: now, durationMs: 60 * 60 * 1000,
    continuous: options.continuous === true, chapter: options.chapter || 'all', topic: options.topic || 'all',
    shownAt: null, paused: false, endedAt: null};
  a.active = s;
  show(p, now);
  return {session: s, warning: selection.warning};
}
function appendNext(b, p, now = Date.now(), random = Math.random) {
  const s = active(p); if (!s || s.kind !== 'practice' || !s.committed[s.questionIds[s.index]]) return {appended:false, warning:''};
  const selection = choose(b, p, {count:1, mode:s.mode || 'smart', kind:'practice', chapter:s.chapter || 'all',
    topic:s.topic || 'all', excludeIds:s.questionIds.slice()}, now, random);
  if (!selection.items.length) return {appended:false, warning:selection.warning};
  const q=selection.items[0];
  settle(s, now);
  s.questionIds.push(q.id); s.snapshots[q.id]=clone(q); s.orders[q.id]=shuffle([0,1,2,3],random);
  s.index=s.questionIds.length-1; s.warning=''; show(p,now);
  return {appended:true, warning:selection.warning};
}
function continuePractice(b, p, now = Date.now(), random = Math.random) {
  const s=active(p); if(!s||s.kind!=='practice') return {session:null,warning:''};
  const meta={mode:s.mode||'smart',chapter:s.chapter||'all',topic:s.topic||'all'};
  const next=appendNext(b,p,now,random); if(next.appended) return {session:active(p),rolled:false,warning:next.warning};
  finish(p,now);
  const started=createSession(b,p,{count:1,mode:meta.mode,kind:'practice',continuous:true,chapter:meta.chapter,topic:meta.topic},now,random);
  return {session:started.session,rolled:true,warning:started.warning};
}
function active(p) { return profile(p).active; }
function current(p) {
  const s = active(p);
  return s ? {s, id: s.questionIds[s.index], q: s.snapshots[s.questionIds[s.index]]} : {};
}
function settle(s, now) {
  if (s.shownAt !== null) {
    const id = s.questionIds[s.index]; s.spent[id] = (s.spent[id] || 0) + Math.max(0, now - s.shownAt);
    s.shownAt = null;
  }
}
function show(p, now = Date.now()) {
  const {s, id, q} = current(p); if (!s || !q) return;
  const a = profile(p);
  if (!s.observed[id]) {
    s.first[id] = !seen(a, id); s.observed[id] = true;
    if (!Object.prototype.hasOwnProperty.call(a.exposures, id)) a.exposures[id] = now;
  }
  if (s.shownAt === null && (s.kind === 'mock' || !s.committed[id])) s.shownAt = now;
  s.paused = false;
}
function pause(p, now = Date.now()) { const s = active(p); if (s) { settle(s, now); s.paused = true; } }
function resume(p, now = Date.now()) { if (active(p)) show(p, now); }
function record(p, s, id, now) {
  const a = profile(p), q = s.snapshots[id];
  if (s.committed[id]) return;
  const earlier = a.history.filter(h => h.topicKey === q.topicKey && h.observed !== false).at(-1);
  const value = validChoice(s.answers[id]) ? s.answers[id] : null;
  const r = {sessionId: s.id, questionId: id, revision: q.revision, topicKey: q.topicKey,
    chapter: q.chapter, selected: value, correct: value === q.correct,
    confidence: s.confidence[id] || 'unknown', firstExposure: s.first[id] === true,
    observed: s.observed[id] === true, otherCaseAfterDelay: !!earlier && earlier.questionId !== id && now - earlier.at >= 2 * DAY,
    seconds: Math.round((s.spent[id] || 0) / 1000), at: now, kind: s.kind, mode: s.mode,
    order: s.orders[id].slice(), answerBeforeExplanation: true};
  a.history.push(r); s.committed[id] = true;
}
function answer(p, value, confidence = 'sure', now = Date.now()) {
  const {s, id} = current(p); if (!s || s.paused || s.endedAt || s.kind === 'practice' && s.committed[id]) return false;
  if (value !== null && !validChoice(value)) throw new Error('選択肢が不正です。');
  if (!['sure', 'guess', 'unknown'].includes(confidence)) throw new Error('確信度が不正です。');
  if (s.kind === 'mock' && now - s.startedAt >= s.durationMs) return false;
  settle(s, now); s.answers[id] = value; s.confidence[id] = value === null ? 'unknown' : confidence;
  if (s.kind === 'practice') record(p, s, id, now);
  else s.shownAt = now;
  return true;
}
function go(p, index, now = Date.now()) {
  const s = active(p); if (!s) return false;
  if (s.kind === 'practice' && !s.committed[s.questionIds[s.index]]) return false;
  if (!Number.isInteger(index) || index < 0 || index >= s.questionIds.length) return false;
  settle(s, now); s.index = index; show(p, now); return true;
}
function finish(p, now = Date.now()) {
  const a = profile(p), s = a.active; if (!s) return a.sessions.at(-1) || null;
  settle(s, now);
  for (const id of s.questionIds) {
    if (!Object.prototype.hasOwnProperty.call(s.answers, id)) { s.answers[id] = null; s.confidence[id] = 'unknown'; }
    record(p, s, id, now);
  }
  const details = a.history.filter(h => h.sessionId === s.id);
  const correct = details.filter(h => h.correct).length;
  const result = {id: s.id, kind: s.kind, mode: s.mode, correct, total: s.questionIds.length,
    accuracy: Math.round(correct / s.questionIds.length * 1000) / 10,
    elapsedSec: s.kind === 'mock' ? Math.round((now - s.startedAt) / 1000) : Math.round(Object.values(s.spent).reduce((x, y) => x + y, 0) / 1000),
    details: clone(details), questions: clone(s.snapshots), finishedAt: now, warning: s.warning};
  a.sessions.push(result); a.active = null; return result;
}
function view(p) {
  const {s, id, q} = current(p); if (!s) return null;
  const revealed = s.kind === 'practice' && !!s.committed[id];
  const publicQ = {id: q.id, text: q.text, chapter: q.chapter};
  const options = s.orders[id].map((original, display) => ({display, original, text: q.options[original],
    selected: s.answers[id] === original, ...(revealed ? {correct: original === q.correct} : {})}));
  return {sessionId: s.id, index: s.index, total: s.questionIds.length, kind: s.kind,
    selected: s.answers[id], confidence: s.confidence[id], committed: !!s.committed[id],
    question: publicQ, options, revealed, ...(revealed ? {feedback: clone(q)} : {})};
}
function stats(b, p, now = Date.now()) {
  const a = profile(p), observed = a.history.filter(h => h.observed !== false && b.byId.has(h.questionId)), answered = new Set(observed.map(h => h.questionId));
  const ratio = hs => ({total: hs.length, correct: hs.filter(h => h.correct).length});
  const ts = [...topicStatus(b, p, now).values()];
  return {total: b.questions.length, topics: b.topics.length, answered: answered.size,
    newCount: b.questions.filter(q => !seen(a, q.id)).length,
    dueTopics: ts.filter(t => t.due).length, weakTopics: ts.filter(t => t.weak).length,
    confirmedAcrossCases: ts.filter(t => t.confirmedAcrossCases).length,
    first: ratio(observed.filter(h => h.firstExposure)), repeat: ratio(observed.filter(h => !h.firstExposure)),
    delayed: ratio(observed.filter(h => h.otherCaseAfterDelay)),
    uncertain: observed.filter(h => h.confidence !== 'sure').length};
}
function bookmark(p, id) { const a = profile(p); a.bookmarks = a.bookmarks.includes(id) ? a.bookmarks.filter(x => x !== id) : [...a.bookmarks, id]; }
function resultText(p, chosenResult = null) {
  const r = chosenResult || profile(p).sessions.at(-1); if (!r) return '事例演習の終了結果はまだありません。';
  const ids=Object.keys(r.questions||{});const version=ids.some(id=>id.startsWith('B15-'))?'v15':ids.some(id=>id.startsWith('A12-'))?'v12':'v11';
  return [`JCSQE 事例演習 ${version} / ${r.id}`,`${r.kind === 'mock' ? '時間制限つき' : '通常演習'} ${r.correct}/${r.total} (${r.accuracy}%) / ${r.elapsedSec}秒`,
    '独自問題。公式と同一難易度ではなく、合格判定ではありません。',
    ...r.details.map((d, i) => `${i + 1}. ${d.questionId} ${d.correct ? '○' : '×'} ${d.confidence} ${d.observed === false ? '未表示・未回答' : d.firstExposure ? 'このブラウザで初回' : '再表示・再回答'}${d.otherCaseAfterDelay ? ' / 別事例の遅延確認' : ''}\n${r.questions[d.questionId].text}`)].join('\n');
}
return {DAY, bank, profile, latest, topicStatus, choose, createSession, appendNext, continuePractice, active, current, show, pause, resume,
  answer, go, finish, view, stats, bookmark, resultText, shuffle};
});
