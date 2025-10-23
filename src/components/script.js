(() => {
  const inputEl = document.getElementById('input');
  const resultEl = document.getElementById('result');
  const statsEl = document.getElementById('stats');

  const formatBtn = document.getElementById('formatBtn');
  const btnSms = document.getElementById('btnSms');
  const btnSms2 = document.getElementById('btnSms2');
  const sampleBtn = document.getElementById('sampleBtn');
  const clearBtn = document.getElementById('clearBtn');

  const copyPlusBtn = document.getElementById('copyPlusBtn');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const copyCombinedBtn = document.getElementById('copyCombinedBtn');
  const copyPairedBtn = document.getElementById('copyPairedBtn');

  const downloadPlusBtn = document.getElementById('downloadPlusBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const downloadCombinedBtn = document.getElementById('downloadCombinedBtn');
  const downloadPairedBtn = document.getElementById('downloadPairedBtn');

  const pasteBtn = document.getElementById('pasteBtn');

  let mode = 'sms2';
  let lastResults = [];
  let particlesRemover = null;

  const debounce = (fn, ms = 400) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  function normalizeDigits(s) {
    if (!s) return '';
    s = s.trim().replace(/^\+/, '').replace(/^00/, '');
    return s.replace(/\D/g, '');
  }

  const KNOWN_CC = new Set([
    '1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39', '40', '41', '43', '44', '49',
    '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66',
    '81', '82', '84', '86', '90', '91', '92', '93', '94', '95', '98',
    '211', '212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229',
    '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245', '246', '248', '249',
    '250', '251', '252', '253', '254', '255', '256', '257', '258', '260', '261', '262', '263', '264', '265', '266', '267', '268', '269',
    '290', '291', '297', '298', '299'
  ]);

  function matchKnownCC(digits) {
    for (let len = 3; len >= 1; len--) {
      if (digits.length <= len) continue;
      const candidate = digits.slice(0, len);
      if (KNOWN_CC.has(candidate)) return candidate;
    }
    return null;
  }

  function detectCCLen(digits) {
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

  function groupLocal(s) {
    const n = s.length;
    if (n === 10) return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}`;
    if (n === 9) return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}`;
    if (n === 8) return `${s.slice(0, 4)} ${s.slice(4)}`;
    if (n === 7) return `${s.slice(0, 3)} ${s.slice(3)}`;
    const parts = [];
    for (let i = 0; i < n; i += 3) parts.push(s.slice(i, i + 3));
    return parts.join(' ');
  }

  function tokenize(raw) {
    if (!raw) return [];
    const unified = raw.replace(/[\r]/g, '').replace(/[;,|]+/g, '\n');
    const lines = unified.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const tokens = [];
    lines.forEach(line => {
      const parts = line.split(/\s+/).filter(Boolean);
      if (parts.length > 1) parts.forEach(p => tokens.push(p));
      else tokens.push(line);
    });
    return tokens;
  }

  function renderPlaceholder() {
    resultEl.innerHTML = `
      <div class="placeholder">
        <span class="material-symbols-outlined accent">space_dashboard</span>
        <p class="muted">Aquí aparecerán los números formateados.</p>
        <button id="pasteBtn" class="btn ghost small" title="Pegar números del portapapeles">
          <span class="material-symbols-outlined">content_paste</span>
          <span>Pegar</span>
        </button>
      </div>`;
    
    const newPasteBtn = document.getElementById('pasteBtn');
    if (newPasteBtn) {
      newPasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            inputEl.value = text;
            processInput(text, mode);
            showToast('Números pegados ✓');
          } else {
            showToast('Portapapeles vacío');
          }
        } catch (e) {
          showToast('No se pudo acceder al portapapeles');
        }
      });
    }
  }

  function renderResults(results) {
    if (!results || results.length === 0) {
      renderPlaceholder();
      return;
    }
    resultEl.innerHTML = '';
    const fragment = document.createDocumentFragment();

    results.forEach((r, idx) => {
      const line = document.createElement('div');
      line.className = 'result-line';
      if (!r.error) line.classList.add('has-value');

      const left = document.createElement('div');
      left.className = 'in';
      left.textContent = r.input;

      const mid = document.createElement('div');
      mid.className = 'tag';
      mid.textContent = r.error ? 'error' : `#${idx + 1}`;

      const right = document.createElement('div');
      right.className = 'out';
      right.textContent = r.formatted || r.plusOnly || (r.error ? `❌ ${r.error}` : '');

      line.appendChild(left);
      line.appendChild(mid);
      line.appendChild(right);

      line.addEventListener('click', async () => {
        const text = r.formatted || r.plusOnly;
        if (!text) {
          showToast('Nada para copiar');
          return;
        }
        try {
          await navigator.clipboard.writeText(text);
          animateElementClick(line);
          showToast('Copiado ✓');
        } catch (e) {
          showToast('Error al copiar');
        }
      });

      fragment.appendChild(line);
    });

    resultEl.appendChild(fragment);

    requestAnimationFrame(() => {
      const nodes = resultEl.querySelectorAll('.result-line');
      nodes.forEach((n, i) => {
        n.style.opacity = '0';
        n.style.transform = 'translateY(8px)';
        setTimeout(() => {
          n.style.transition = 'opacity .38s ease, transform .38s cubic-bezier(.2,.9,.2,1)';
          n.style.opacity = '1';
          n.style.transform = 'translateY(0)';
        }, i * 60);
      });
    });
  }

  function updateStats(total, valid, invalid) {
    if (statsEl) statsEl.textContent = `Números: ${total} — Válidos: ${valid} — Inválidos: ${invalid}`;
  }

  function animateElementClick(el) {
    if (!el) return;
    el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 220 });
  }

  function showToast(msg, ms = 1200) {
    let toast = document.getElementById('sms-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sms-toast';
      toast.className = 'sms-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), ms);
  }

  function processInput(raw, modeParam) {
    try {
      const tokens = tokenize(raw || '');
      if (!tokens.length) {
        lastResults = [];
        renderPlaceholder();
        updateStats(0, 0, 0);
        updateActionButtons();
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

        if (modeParam === 'sms') {
          results.push({ input: token, plusOnly, formatted: null, error: null });
          valid++;
          return;
        }

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
      updateActionButtons();
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      console.error(e);
      showToast('Error al procesar');
    }
  }

  function getPlusOnlyText() {
    if (!lastResults || !lastResults.length) return '';
    return lastResults.map(r => r.plusOnly).filter(Boolean).join('\n');
  }

  function getFormattedText() {
    if (!lastResults || !lastResults.length) return '';
    return lastResults.map(r => r.formatted || r.plusOnly).filter(Boolean).join('\n');
  }

  function getCombinedText() {
    if (!lastResults || !lastResults.length) return '';
    const lines = [];
    lastResults.forEach((r, idx) => {
      const digits = (r.plusOnly || '').replace(/^\+/, '');
      let formatted = r.formatted;
      if (!formatted && digits) {
        const ccLen = detectCCLen(digits);
        const cc = digits.slice(0, ccLen);
        const local = digits.slice(ccLen);
        formatted = local ? `+${cc} ${groupLocal(local)}` : `+${cc}`;
      }
      lines.push(`#${idx + 1}`);
      lines.push(formatted || `+${digits}`);
    });
    return lines.join('\n');
  }

  function getPairedText() {
    if (!lastResults || !lastResults.length) return '';
    return lastResults.map(r => {
      const digits = (r.plusOnly || '').replace(/^\+/, '');
      let formatted = r.formatted;
      if (!formatted && digits) {
        const ccLen = detectCCLen(digits);
        const cc = digits.slice(0, ccLen);
        const local = digits.slice(ccLen);
        formatted = local ? `+${cc} ${groupLocal(local)}` : `+${cc}`;
      }
      return `${formatted || `+${digits}`},${digits}`;
    }).join('\n');
  }

  async function copyOutput(type) {
    let text = '';
    let btn = null;
    if (type === 'plus') {
      text = getPlusOnlyText();
      btn = copyPlusBtn;
    } else if (type === 'formatted') {
      text = getFormattedText();
      btn = copyAllBtn;
    } else if (type === 'combined') {
      text = getCombinedText();
      btn = copyCombinedBtn;
    } else {
      text = getPairedText();
      btn = copyPairedBtn;
    }

    if (!text) {
      showToast('No hay resultados');
      flashBtn(btn, 'No hay resultados');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      flashBtn(btn, 'Copiado ✓');
      showToast('Copiado al portapapeles');
    } catch (e) {
      flashBtn(btn, 'Error', true);
      showToast('Error al copiar');
    }
  }

  function downloadOutput(type) {
    let text = '';
    let name = 'sms-output.txt';
    if (type === 'plus') {
      text = getPlusOnlyText();
      name = 'sms-plus-only.txt';
    } else if (type === 'formatted') {
      text = getFormattedText();
      name = 'sms-formatted.txt';
    } else if (type === 'combined') {
      text = getCombinedText();
      name = 'sms-enumerado.txt';
    } else {
      text = getPairedText();
      name = 'sms-enlistado.txt';
    }

    if (!text) {
      showToast('No hay resultados');
      return;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });

    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, name);
      showToast('Archivo listo para descargar');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);

    const ev = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
    a.dispatchEvent(ev);

    setTimeout(() => {
      URL.revokeObjectURL(url);
      try {
        a.remove();
      } catch (e) {
        /* ignore */
      }
    }, 250);

    showToast('Archivo listo para descargar');
  }

  function flashBtn(btn, text, err = false, ms = 1000) {
    if (!btn) return;
    const prev = btn.innerHTML;
    btn.innerText = text;
    btn.style.opacity = err ? 0.9 : 1;
    btn.style.transform = 'scale(1.05)';
    btn.style.transition = 'all 0.2s ease';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 100);
    setTimeout(() => {
      btn.innerHTML = prev;
      btn.style.opacity = '';
      btn.style.transform = '';
      btn.style.transition = '';
    }, ms);
  }

  function updateActionButtons() {
    const has = lastResults && lastResults.length > 0;
    const buttons = [copyPlusBtn, copyAllBtn, copyCombinedBtn, copyPairedBtn, downloadPlusBtn, downloadAllBtn, downloadCombinedBtn, downloadPairedBtn];
    buttons.forEach(b => {
      if (!b) return;
      b.disabled = !has;
      b.style.opacity = has ? 1 : 0.5;
    });
  }

  function attachRippleToButtons() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('pointerdown', (ev) => {
        const r = document.createElement('span');
        r.className = 'ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.5;
        r.style.width = r.style.height = `${size}px`;
        r.style.left = `${ev.clientX - rect.left - size / 2}px`;
        r.style.top = `${ev.clientY - rect.top - size / 2}px`;
        btn.appendChild(r);
        setTimeout(() => r.remove(), 600);
      });
    });
  }

  function createParticles() {
    const container = document.getElementById('bg-decor');
    if (!container) return () => {};
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const particles = [];
    const count = Math.max(18, Math.floor((w * h) / 90000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 2.4,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      });
    }
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    let raf;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        g.addColorStop(0, 'rgba(165,108,255,0.16)');
        g.addColorStop(0.35, 'rgba(122,252,255,0.04)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.remove();
    };
  }

  function bindEvents() {
    if (formatBtn) formatBtn.addEventListener('click', () => processInput(inputEl.value || '', mode));
    if (btnSms) btnSms.addEventListener('click', () => {
      mode = 'sms';
      btnSms.classList.add('active');
      btnSms2.classList.remove('active');
    });
    if (btnSms2) btnSms2.addEventListener('click', () => {
      mode = 'sms2';
      btnSms2.classList.add('active');
      btnSms.classList.remove('active');
    });
    if (sampleBtn) sampleBtn.addEventListener('click', () => {
      inputEl.value = `584263683714
584266055913
584261554735
584161769530
+51907182818
(580) 426-366-3714
0044 7700 900123`;
      processInput(inputEl.value, mode);
    });
    if (clearBtn) clearBtn.addEventListener('click', () => {
      inputEl.value = '';
      lastResults = [];
      renderPlaceholder();
      updateStats(0, 0, 0);
      updateActionButtons();
    });

    if (copyPlusBtn) copyPlusBtn.addEventListener('click', () => copyOutput('plus'));
    if (copyAllBtn) copyAllBtn.addEventListener('click', () => copyOutput('formatted'));
    if (copyCombinedBtn) copyCombinedBtn.addEventListener('click', () => copyOutput('combined'));
    if (copyPairedBtn) copyPairedBtn.addEventListener('click', () => copyOutput('paired'));

    if (downloadPlusBtn) downloadPlusBtn.addEventListener('click', () => downloadOutput('plus'));
    if (downloadAllBtn) downloadAllBtn.addEventListener('click', () => downloadOutput('formatted'));
    if (downloadCombinedBtn) downloadCombinedBtn.addEventListener('click', () => downloadOutput('combined'));
    if (downloadPairedBtn) downloadPairedBtn.addEventListener('click', () => downloadOutput('paired'));

    if (pasteBtn) pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          inputEl.value = text;
          processInput(text, mode);
          showToast('Números pegados ✓');
        } else {
          showToast('Portapapeles vacío');
        }
      } catch (e) {
        showToast('No se pudo acceder al portapapeles');
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        processInput(inputEl.value || '', mode);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === '1') copyOutput('plus');
        if (e.key === '2') copyOutput('formatted');
        if (e.key === '3') copyOutput('combined');
      }
    });

    const deb = debounce(() => {}, 700);
    inputEl.addEventListener('input', deb);
  }

  (function init() {
    renderPlaceholder();
    updateStats(0, 0, 0);
    updateActionButtons();
    attachRippleToButtons();
    bindEvents();
    try {
      particlesRemover = createParticles();
    } catch (e) {
      /* ignore */
    }

    const s = document.createElement('style');
    s.textContent = `
      .ripple{ position:absolute;border-radius:999px;transform:scale(0);background:rgba(255,255,255,0.12);pointer-events:none;opacity:0.95;mix-blend-mode:screen;transition:transform .45s cubic-bezier(.2,.9,.2,1), opacity .45s; }
      button{ position:relative; overflow:hidden; }
      .sms-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:24px; background:rgba(12,8,18,0.9); color:#e7eef8; padding:10px 16px; border-radius:10px; z-index:9999; box-shadow:0 10px 30px rgba(150,80,255,0.12); opacity:0; pointer-events:none; transition:opacity .18s ease, transform .18s ease; font-weight:700; }
      .sms-toast.visible{ opacity:1; transform:translateX(-50%) translateY(0); pointer-events:auto; }
    `;
    document.head.appendChild(s);
  })();

  window.smsFormat = {
    processInput,
    getPlusOnlyText,
    getFormattedText,
    getCombinedText,
    getPairedText,
    lastResults: () => lastResults
  };
})();
