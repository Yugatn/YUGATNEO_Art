import test from 'node:test';
import assert from 'node:assert/strict';
import {
  splitCents, previewPrizeFund, scoreExpertWork, mixPanels,
  NOMINATIONS, PROPOSED_FUND_BPS,
  DONATION_CAN_AFFECT_ELIGIBILITY_OR_RANKING
} from '../src/contest-core.mjs';

test('all allocations preserve every cent for 0..9999', () => {
  for (let i = 0; i < 10000; i++) {
    const b = splitCents(i, PROPOSED_FUND_BPS);
    assert.equal(Object.values(b).reduce((a,c)=>a+c,0), i);
    assert.ok(Object.values(b).every(x=>Number.isInteger(x) && x>=0));
  }
});
test('million one-cent donors = $10,000 (before fees)', () => {
  const a = previewPrizeFund(1_000_000);
  assert.equal(a.prizePool, 850_000);
  assert.equal(a.accessibilityAndTranslations, 100_000);
  assert.equal(a.infrastructure, 50_000);
});
test('million one-dollar donors = $1 million (before fees)', () => {
  const a = previewPrizeFund(100_000_000);
  assert.equal(a.prizePool, 85_000_000);
  assert.equal(a.accessibilityAndTranslations, 10_000_000);
  assert.equal(a.infrastructure, 5_000_000);
});
test('all nomination budgets and 3 awards conserve money', () => {
  for (const i of [0,1,2,3,9,11,100,1_000_000,100_000_000]) {
    const a = previewPrizeFund(i);
    const p = Object.values(a.awardPlan);
    assert.equal(p.length, NOMINATIONS.length);
    assert.equal(p.reduce((x,y)=>x+y.budgetCents,0), a.prizePool);
    for (const item of p) {
      assert.equal(Object.values(item.proposedTopThree).reduce((x,y)=>x+y,0),item.budgetCents);
    }
  }
});
test('rejects negative/fractional/unsafe values', () => {
  for (const n of [-1,1.5,NaN,Infinity,'10',Number.MAX_SAFE_INTEGER+1]) {
    assert.throws(()=>previewPrizeFund(n));
  }
});
test('rejects invalid percentages', () => {
  assert.throws(()=>splitCents(100,{foo:9999}));
  assert.throws(()=>splitCents(100,{foo:10001}));
  assert.throws(()=>splitCents(100,{foo:-5,bar:10005}));
});
test('100-yearly dollar independent of donations for ranking', () => {
  assert.equal(DONATION_CAN_AFFECT_ELIGIBILITY_OR_RANKING,false);
  // No donor or payment parameter exists in score functions.
  assert.equal(scoreExpertWork({
    artistry:10,originality:10,mutuallyBeneficialCooperation:10,
    empatheticComplexity:10,contextAndConsequences:10
  }),100);
});
test('zero and perfect creative scores', () => {
  assert.equal(scoreExpertWork({
    artistry:0,originality:0,mutuallyBeneficialCooperation:0,
    empatheticComplexity:0,contextAndConsequences:0
  }),0);
  assert.equal(scoreExpertWork({
    artistry:10,originality:10,mutuallyBeneficialCooperation:10,
    empatheticComplexity:10,contextAndConsequences:10
  }),100);
});
test('expert scoring is weighted by the declared criteria', () => {
  assert.equal(scoreExpertWork({
    artistry:10,originality:0,mutuallyBeneficialCooperation:0,
    empatheticComplexity:0,contextAndConsequences:0
  }),20);
  assert.equal(scoreExpertWork({
    artistry:0,originality:0,mutuallyBeneficialCooperation:10,
    empatheticComplexity:0,contextAndConsequences:0
  }),25);
});
test('invalid/missing category cannot be silently evaluated', () => {
  assert.throws(()=>scoreExpertWork({artistry:10}));
  assert.throws(()=>scoreExpertWork({
    artistry:11, originality:10, mutuallyBeneficialCooperation:10,
    empatheticComplexity:10,contextAndConsequences:10
  }));
});
test('independent experts 60%, creative 20%, public 20% (demo only)', () => {
  assert.equal(mixPanels({independentExperts:100,internationalCreators:0,publicAudience:0}),60);
  assert.equal(mixPanels({independentExperts:0,internationalCreators:100,publicAudience:0}),20);
  assert.equal(mixPanels({independentExperts:0,internationalCreators:0,publicAudience:100}),20);
});
test('panel scores are bounded and must be complete', () => {
  assert.throws(()=>mixPanels({independentExperts:99}));
  assert.throws(()=>mixPanels({independentExperts:99,internationalCreators:0,publicAudience:101}));
});
test('outcomes are only simulations, not payment promises', () => {
  const a = previewPrizeFund(10_000);
  assert.equal(a.status,'DEMONSTRATION_NOT_A_PRIZE_PROMISE');
  assert.ok(!('bankAccount' in a) && !('transfer' in a) && !('payment' in a));
});
