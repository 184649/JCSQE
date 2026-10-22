const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../cumulative-stats.js');
const profile = history => ({appliedStudy: {history}});
const row = (correct, extra = {}) => ({kind:'practice', observed:true, correct, ...extra});

test('no answers shows zero counts and an undefined rate, not NaN or a misleading 0%', () => {
  for (const p of [undefined, {}, profile([]), profile(null)]) {
    const s = S.summarize(p);
    assert.deepEqual(s, {answered:0, correct:0, accuracy:null});
    assert.equal(S.accuracyText(s), '—');
  }
});
test('accuracy uses correct / answered and one decimal place', () => {
  const s = S.summarize(profile([row(true),row(false),row(true)]));
  assert.deepEqual(s, {answered:3, correct:2, accuracy:66.7});
  assert.equal(S.accuracyText(s), '66.7%');
  assert.equal(S.accuracyText(S.summarize(profile([row(true)]))), '100.0%');
  assert.equal(S.accuracyText(S.summarize(profile([row(false)]))), '0.0%');
});
test('repeat practice is counted as attempts, not unique problem IDs', () => {
  const history=[row(false,{questionId:'same',sessionId:'one'}),row(true,{questionId:'same',sessionId:'two'})];
  assert.deepEqual(S.summarize(profile(history)), {answered:2,correct:1,accuracy:50});
});
test('explicit unknown is a completed incorrect attempt', () => {
  const s = S.summarize(profile([row(true),row(false,{selected:null,confidence:'unknown'})]));
  assert.deepEqual(s, {answered:2,correct:1,accuracy:50});
});
test('unobserved automatic allocations and all mock results are excluded', () => {
  const s = S.summarize(profile([row(true),row(false,{observed:false}),row(true,{kind:'mock'}),row(false,{kind:'mock'})]));
  assert.deepEqual(s, {answered:1,correct:1,accuracy:100});
});
test('uncommitted current question is not added merely by displaying it', () => {
  const p=profile([row(true)]);
  p.appliedStudy.active={kind:'practice',questionIds:['one','two'],index:1,answers:{one:1},committed:{one:true}};
  assert.deepEqual(S.summarize(p), {answered:1,correct:1,accuracy:100});
});
test('prior question revisions are included; missing old observed flag is compatible', () => {
  const s=S.summarize(profile([row(true,{questionId:'A11-old',revision:11,observed:undefined}),row(false,{questionId:'B15-new',revision:15})]));
  assert.deepEqual(s,{answered:2,correct:1,accuracy:50});
});
test('reading totals is non-mutating and respects the selected profile only', () => {
  const a=profile([row(false)]),b=profile([row(true),row(true)]);
  a.history=[{correct:true}];a.sessions=[{correct:40,total:40}];a.dojo={history:[row(true)]};
  const before=JSON.stringify(a);Object.freeze(a.appliedStudy.history);Object.freeze(a.appliedStudy);Object.freeze(a);
  assert.equal(S.summarize(a).correct,0);assert.equal(JSON.stringify(a),before);
  assert.equal(S.summarize(b).correct,2);
});
test('malformed rows do not inflate the denominator', () => {
  const p=profile([null,{},row('true'),row(1),row(false,{kind:undefined}),row(true)]);
  assert.deepEqual(S.summarize(p),{answered:1,correct:1,accuracy:100});
});
test('in-memory history is immediately used even before persistence succeeds', () => {
  const p=profile([row(false)]);
  assert.equal(S.summarize(p).answered,1);
  p.appliedStudy.history.push(row(true));
  assert.deepEqual(S.summarize(p),{answered:2,correct:1,accuracy:50});
});
