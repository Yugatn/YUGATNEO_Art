import { previewPrizeFund } from './src/contest-core.mjs';

const supportersInput = document.getElementById('supporters');
const amountSelect = document.getElementById('amount');
const gross = document.getElementById('gross');
const prizes = document.getElementById('prizes');
const access = document.getElementById('access');
const ops = document.getElementById('ops');

const numberFormat = new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'USD',
  maximumFractionDigits: 2, minimumFractionDigits: 0
});

function dollars(cents) {
  return numberFormat.format(cents / 100);
}

function calculate() {
  // Client-side, read-only *hypothetical* simulation — no payments, storage, tracking.
  const people = Number(supportersInput.value);
  const perPersonCents = Math.round(Number(amountSelect.value) * 100);
  if (!Number.isSafeInteger(people) || people < 0 || people > 1_000_000_000 ||
      !Number.isSafeInteger(perPersonCents) || perPersonCents < 0 ||
      !Number.isSafeInteger(people * perPersonCents)) {
    for (const out of [gross, prizes, access, ops]) out.textContent = '—';
    return;
  }
  const model = previewPrizeFund(people * perPersonCents);
  gross.textContent = dollars(model.cents);
  prizes.textContent = dollars(model.prizePool);
  access.textContent = dollars(model.accessibilityAndTranslations);
  ops.textContent = dollars(model.infrastructure);
}

supportersInput.addEventListener('input', calculate);
amountSelect.addEventListener('change', calculate);
calculate();
