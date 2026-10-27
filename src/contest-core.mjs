/**
 * Конкурс Юджина — чистые расчёты, БЕЗ платежей, БЕЗ приёма заявок.
 * Результаты — исключительно демонстрационные; все веса и доли требуют
 * утверждения ДО объявления денежного сезона.
 */

export const PROPOSED_FUND_BPS = Object.freeze({
  prizePool: 8500, accessibilityAndTranslations: 1000, infrastructure: 500
});

export const NOMINATIONS = Object.freeze([
  "visualWorld", "musicOfPeace", "futureStories", "worldTogether"
]);

export const PROPOSED_EXPERT_CRITERIA = Object.freeze({
  artistry: 20,
  originality: 20,
  mutuallyBeneficialCooperation: 25,
  empatheticComplexity: 20,
  contextAndConsequences: 15
});

export const PROPOSED_PANEL_WEIGHTS = Object.freeze({
  independentExperts: 60, internationalCreators: 20, publicAudience: 20
});

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function requirePlainWeights(weights, expectedTotal) {
  if (!weights || typeof weights !== "object" || Array.isArray(weights)) {
    throw new TypeError("weights must be an object");
  }
  const entries = Object.entries(weights);
  if (!entries.length || entries.some(([key, weight]) =>
    !key || !Number.isSafeInteger(weight) || weight < 0) ||
    entries.reduce((sum, [,weight]) => sum + weight, 0) !== expectedTotal) {
    throw new RangeError("weights must be nonnegative integers summing to target");
  }
  return entries;
}

export function splitCents(cents, weightsBps) {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError("cents must be a nonnegative safe integer");
  }
  const entries = requirePlainWeights(weightsBps, 10000);
  const total = BigInt(cents);
  const parts = entries.map(([name, weight], order) => {
    const numerator = total * BigInt(weight);
    const whole = numerator / 10000n;
    const rem = numerator % 10000n;
    return {name, order, value: whole, remainder: rem};
  });
  let rest = total - parts.reduce((sum, part) => sum + part.value, 0n);
  const priority = [...parts].sort((a, b) => {
    if (a.remainder !== b.remainder) return a.remainder > b.remainder ? -1 : 1;
    return a.order - b.order;
  });
  for (let i = 0; i < Number(rest); i++) priority[i].value++;
  return Object.fromEntries(parts.map(part => [part.name, Number(part.value)]));
}

/**
 * Demonstrative 85/10/5 and four equal nominations with 50/30/20.
 * A public contest MUST publish a guaranteed prize sum and official rules.
 */
export function previewPrizeFund(confirmedNetUnrestrictedUsdCents) {
  const buckets = splitCents(confirmedNetUnrestrictedUsdCents, PROPOSED_FUND_BPS);
  const nominations = splitCents(
    buckets.prizePool,
    Object.fromEntries(NOMINATIONS.map((name) => [name, 2500]))
  );
  const awardPlan = Object.fromEntries(Object.entries(nominations).map(([name, sum]) => [
    name, {budgetCents: sum, proposedTopThree: splitCents(sum, {
      first: 5000, second: 3000, third: 2000
    })}
  ]));
  return {
    status: "DEMONSTRATION_NOT_A_PRIZE_PROMISE",
    currency: "USD",
    cents: confirmedNetUnrestrictedUsdCents,
    ...buckets,
    awardPlan
  };
}

function rating(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 10) {
    throw new RangeError("expert rating must be a number from 0 to 10");
  }
  return value;
}

/** Five contextual criteria, 0..10 each. Weighted result 0..100. */
export function scoreExpertWork(criteria) {
  const keys = Object.keys(PROPOSED_EXPERT_CRITERIA);
  if (!criteria || typeof criteria !== "object" ||
      Object.keys(criteria).length !== keys.length ||
      keys.some(key => !hasOwn(criteria,key))) {
    throw new Error("must score all five criteria, no extras");
  }
  const points = keys.reduce((sum, key) =>
    sum + rating(criteria[key]) * PROPOSED_EXPERT_CRITERIA[key], 0) / 10;
  return Math.round(points * 100) / 100;
}

/** Three validated panels 0..100; no votes or identities verified here. */
export function mixPanels(panels) {
  const keys = Object.keys(PROPOSED_PANEL_WEIGHTS);
  if (!panels || typeof panels !== "object" ||
      Object.keys(panels).length !== keys.length ||
      keys.some(key => !hasOwn(panels,key))) {
    throw new Error("all three panels required");
  }
  let combined = 0;
  for (const key of keys) {
    const score = panels[key];
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100) {
      throw new RangeError("panel rating must be 0..100");
    }
    combined += score * PROPOSED_PANEL_WEIGHTS[key] / 100;
  }
  return Math.round(combined * 100) / 100;
}

/** This prevents public claims that donations confer any judging advantage. */
export const DONATION_CAN_AFFECT_ELIGIBILITY_OR_RANKING = false;
