(() => {
  // DOM
  const inputEl = document.getElementById('input');
  const formatBtn = document.getElementById('formatBtn');
  const resultEl = document.getElementById('result');
  const statsEl = document.getElementById('stats');

  const copyPlusBtn = document.getElementById('copyPlusBtn');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const downloadPlusBtn = document.getElementById('downloadPlusBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');

  const clearBtn = document.getElementById('clearBtn');
  const sampleBtn = document.getElementById('sampleBtn');
  const btnSms = document.getElementById('btnSms');
  const btnSms2 = document.getElementById('btnSms2');

  let mode = 'sms2'; // default
  let lastResults = []; // [{ input, plusOnly, formatted, error }]

  // events
  btnSms.addEventListener('click', () => setMode('sms'));
  btnSms2.addEventListener('click', () => setMode('sms2'));
  sampleBtn.addEventListener('click', loadSample);
  clearBtn.addEventListener('click', clearAll);
  formatBtn.addEventListener('click', () => processInput(inputEl.value || '', mode));

  copyPlusBtn.addEventListener('click', () => copyOutput('plus'));
  copyAllBtn.addEventListener('click', () => copyOutput('formatted'));
  downloadPlusBtn.addEventListener('click', () => downloadOutput('plus'));
  downloadAllBtn.addEventListener('click', () => downloadOutput('formatted'));

  inputEl.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') formatBtn.click();
  });

  function setMode(m) {
    mode = m;
    btnSms.classList.toggle('active', m === 'sms');
    btnSms2.classList.toggle('active', m === 'sms2');
  }

  function loadSample(){
    inputEl.value = `584263683714
584266055913
584261554735
584161769530
+51907182818
(580) 426-366-3714
0044 7700 900123`;
    processInput(inputEl.value, mode);
  }

  function clearAll(){
    inputEl.value = '';
    lastResults = [];
    renderPlaceholder();
    updateStats(0,0,0);
    updateActionButtonsState();
  }

  const KNOWN_CC = new Set([
    '1','7','20','27','30','31','32','33','34','36','39','40','41','43','44','49',
    '51','52','53','54','55','56','57','58','60','61','62','63','64','65','66',
    '81','82','84','86','90','91','92','93','94','95','98',
    '211','212','213','216','218','220','221','222','223','224','225','226','227','228','229',
    '230','231','232','233','234','235','236','237','238','239','240','241','242','243','244','245','246','248','249',
    '250','251','252','253','254','255','256','257','258','260','261','262','263','264','265','266','267','268','269',
    '290','291','297','298','299'
  ]);

  function matchKnownCC(digits) {
    for (let len = 3; len >= 1; len--) {
      if (digits.length <= len) continue;
      const candidate = digits.slice(0, len);
      if (KNOWN_CC.has(candidate)) return candidate;
    }
    return null;
  }

  function normalizeDigits(s){
    if (!s) return '';
    s = s.trim();
    s = s.replace(/^\+/, '');
    s = s.replace(/^00/, '');
    const digits = s.replace(/\D/g, '');
    return digits;
  }

  function detectCCLen(digits){
    const matched = matchKnownCC(digits);
    if (matched) return matched.length;

    const total = digits.length;
    for (let c = 1; c <= 3; c++) {
      const localLen = total - c;
      if (localLen >= 7 && localLen <= 10) return c;
    }
    if (total > 9) return Math.min(3, total - 9);
    return 1;
  }

  function groupLocal(s){
    const n = s.length;
    if (n === 10) return `${s.slice(0,3)} ${s.slice(3,6)} ${s.slice(6)}`;
    if (n === 9) return `${s.slice(0,3)} ${s.slice(3,6)} ${s.slice(6)}`;
    if (n === 8) return `${s.slice(0,4)} ${s.slice(4)}`;
    if (n === 7) return `${s.slice(0,3)} ${s.slice(3)}`;
    const parts = [];
    for (let i = 0; i < n; i += 3) parts.push(s.slice(i, i + 3));
    return parts.join(' ');
  }

  function tokenize(raw){
    if (!raw) return [];
    const unified = raw.replace(/[\r]/g,'').replace(/[;,|]+/g, '\n');
    const lines = unified.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const tokens = [];
    lines.forEach(line => {
      const parts = line.split(/\s+/).filter(Boolean);
      if (parts.length > 1) {
        parts.forEach(p => tokens.push(p));
      } else {
        tokens.push(line);
      }
    });
    return tokens;
  }

  // process and produce both outputs
  function processInput(raw, cmd){
    try {
      const tokens = tokenize(raw);
      if (tokens.length === 0) {
        lastResults = [];
        renderPlaceholder();
        updateStats(0,0,0);
        updateActionButtonsState();
        return;
      }

      const results = [];
      let valid = 0, invalid = 0;

      tokens.forEach(token => {
        const digits = normalizeDigits(token);
        if (!digits) {
          results.push({ input: token, plusOnly: null, formatted: null, error: 'No digits' });
          invalid++;
          return;
        }

        const plusOnly = `+${digits}`;

        if (cmd === 'sms') {
          results.push({ input: token, plusOnly, formatted: null, error: null });
          valid++;
          return;
        }

        // sms2 -> formatted
        const ccLen = detectCCLen(digits);
        const cc = digits.slice(0, ccLen);
        const local = digits.slice(ccLen);
        if (!local) {
          results.push({ input: token, plusOnly, formatted: `+${cc}`, error: 'Sin parte local' });
          invalid++;
          return;
        }
        const formattedLocal = groupLocal(local);
        const formatted = `+${cc} ${formattedLocal}`;
        results.push({ input: token, plusOnly, formatted, error: null });
        valid++;
      });

      lastResults = results;
      renderResults(results);
      updateStats(tokens.length, valid, invalid);
      updateActionButtonsState();
    } catch (e) {
      console.error(e);
      resultEl.innerHTML = `<div class="placeholder"><p class="muted">Error al procesar</p></div>`;
      lastResults = [];
      updateActionButtonsState();
    }
  }

  function updateStats(total, valid, invalid){
    statsEl.textContent = `Números: ${total} — Válidos: ${valid} — Inválidos: ${invalid}`;
  }

  function renderPlaceholder(){
    resultEl.innerHTML = `
      <div class="placeholder">
        <svg class="spark" width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="muted">Aquí aparecerán los números formateados.</p>
      </div>`;
  }

  function renderResults(results){
    if (!results || results.length === 0) {
      renderPlaceholder();
      return;
    }
    resultEl.innerHTML = '';
    results.forEach((r, idx) => {
      const el = document.createElement('div');
      el.className = 'line';

      const left = document.createElement('div');
      left.className = 'in';
      left.textContent = r.input;

      const center = document.createElement('div');
      center.className = 'tag';
      center.textContent = r.error ? 'error' : `#${idx+1}`;

      const right = document.createElement('div');
      right.className = 'out';
      // Prefer showing formatted if exists, otherwise plusOnly
      right.textContent = r.formatted || r.plusOnly || (r.error ? `${r.error}` : '');

      el.appendChild(left);
      el.appendChild(center);
      el.appendChild(right);

      // Click to copy the displayed output
      el.addEventListener('click', async () => {
        const text = r.formatted || r.plusOnly;
        if (!text) return;
        try {
          await navigator.clipboard.writeText(text);
          el.animate([{ transform:'translateY(0)' }, { transform:'translateY(-6px)' }, { transform:'translateY(0)' }], { duration:300 });
        } catch (e) { /* ignore */ }
      });

      resultEl.appendChild(el);
    });
  }

  // Collect output text for copy/download using lastResults (reliable)
  function getAllText(variant = 'formatted') {
    // variant: 'formatted' or 'plus'
    if (!lastResults || lastResults.length === 0) return '';
    const lines = [];
    lastResults.forEach(r => {
      if (!r) return;
      if (variant === 'plus') {
        if (r.plusOnly) lines.push(r.plusOnly);
      } else {
        // prefer formatted, fallback to reconstruct formatting if missing
        if (r.formatted) lines.push(r.formatted);
        else if (r.plusOnly) {
          // rebuild formatted if needed
          const digits = r.plusOnly.replace(/^\+/, '');
          const ccLen = detectCCLen(digits);
          const cc = digits.slice(0, ccLen);
          const local = digits.slice(ccLen);
          if (!local) lines.push(`+${cc}`);
          else lines.push(`+${cc} ${groupLocal(local)}`);
        }
      }
    });
    return lines.join('\n');
  }

  async function copyOutput(variant){
    const text = getAllText(variant === 'plus' ? 'plus' : 'formatted');
    const btn = variant === 'plus' ? copyPlusBtn : copyAllBtn;
    if (!text) return flash(btn, 'No hay resultados');
    try {
      await navigator.clipboard.writeText(text);
      flash(btn, 'Copiado ✓', 1200);
    } catch (e) {
      flash(btn, 'Error al copiar', 1200, true);
    }
  }

  function downloadOutput(variant){
    const text = getAllText(variant === 'plus' ? 'plus' : 'formatted');
    const btn = variant === 'plus' ? downloadPlusBtn : downloadAllBtn;
    if (!text) return flash(btn, 'No hay resultados');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = variant === 'plus' ? 'sms-plus-only.txt' : 'sms-formatted.txt';
    a.click();
    URL.revokeObjectURL(url);
    flash(btn, 'Descargado ✓', 1200);
  }

  function flash(btn, text, ms = 900, err = false){
    const prev = btn.innerText;
    btn.innerText = text;
    btn.style.opacity = err ? 0.9 : 1;
    setTimeout(() => { btn.innerText = prev; btn.style.opacity = ''; }, ms);
  }

  function updateActionButtonsState(){
    const has = lastResults && lastResults.length > 0;
    [copyPlusBtn, copyAllBtn, downloadPlusBtn, downloadAllBtn].forEach(b => {
      b.disabled = !has;
      b.style.opacity = has ? '' : 0.5;
      if (!has) b.classList.remove('active');
    });
  }

  // initialize
  renderPlaceholder();
  updateStats(0,0,0);
  updateActionButtonsState();
})();