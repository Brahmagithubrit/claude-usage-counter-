
let _isMinimized = false;
let _isDragging = false;
let _dragOffsetX = 0;
let _dragOffsetY = 0;
let _lastData = null;

function buildRing(pct, colorVar, size = 54) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const id = `ring-grad-${colorVar.replace(/[^a-z]/gi, "")}${Math.random().toString(36).slice(2, 6)}`;

  return `
    <svg class="ring-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="var(${colorVar}-start, var(${colorVar}))" />
          <stop offset="100%" stop-color="var(${colorVar}-end, var(${colorVar}))" />
        </linearGradient>
        <filter id="glow-${id}">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" />
      <circle
        class="ring-fill"
        cx="${size / 2}" cy="${size / 2}" r="${r}"
        stroke="url(#${id})"
        stroke-dasharray="${dash} ${circ}"
        stroke-dashoffset="0"
        filter="url(#glow-${id})"
        style="--circ:${circ};--dash:${dash}"
      />
      <text class="ring-text" x="${size / 2}" y="${size / 2 + 1}" text-anchor="middle" dominant-baseline="middle">${pct}%</text>
    </svg>`;
}

function statusBadge(pct) {
  if (pct > 80) return { label: "CRITICAL", cls: "badge-critical" };
  if (pct > 60) return { label: "HIGH", cls: "badge-high" };
  if (pct > 35) return { label: "MODERATE", cls: "badge-moderate" };
  return { label: "HEALTHY", cls: "badge-ok" };
}

function buildBar(pct, colorVar) {
  const safeW = Math.min(pct, 100);
  return `
    <div class="bar-track">
      <div class="bar-fill" style="width:${safeW}%; --bar-color:var(${colorVar}); --bar-color-start:var(${colorVar}-start, var(${colorVar})); --bar-color-end:var(${colorVar}-end, var(${colorVar}))">
        <span class="bar-shine"></span>
      </div>
      ${pct > 75 ? `<div class="bar-danger-pulse" style="left:${safeW}%"></div>` : ""}
    </div>`;
}

function buildTokenEstimate(pct, limit = 50000) {
  const used = Math.round((pct / 100) * limit);
  const remaining = limit - used;
  const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n);
  return `
    <div class="token-row">
      <div class="token-stat">
        <span class="token-val">${fmt(used)}</span>
        <span class="token-key">USED</span>
      </div>
      <div class="token-divider"></div>
      <div class="token-stat">
        <span class="token-val">${fmt(remaining)}</span>
        <span class="token-key">LEFT</span>
      </div>
      <div class="token-divider"></div>
      <div class="token-stat">
        <span class="token-val">${fmt(limit)}</span>
        <span class="token-key">LIMIT</span>
      </div>
    </div>`;
}

function healthScore(fiveHour, week) {
  const score = Math.max(0, 100 - (fiveHour * 0.6 + week * 0.4));
  return Math.round(score);
}

function renderUI(data) {
  _lastData = data;
  let el = document.getElementById("cc-widget");

  const isNew = !el;
  if (isNew) {
    el = document.createElement("div");
    el.id = "cc-widget";
    document.body.appendChild(el);
    injectDragBehavior(el);
  }

  const fiveColor =
    data.fiveHour > 80
      ? "--clr-danger"
      : data.fiveHour > 55
        ? "--clr-warn"
        : "--clr-accent";
  const weekColor =
    data.week > 80
      ? "--clr-danger"
      : data.week > 55
        ? "--clr-warn"
        : "--clr-week";

  const fiveBadge = statusBadge(data.fiveHour);
  const weekBadge = statusBadge(data.week);
  const health = healthScore(data.fiveHour, data.week);

  const nowTs = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  el.innerHTML = `
    <!-- ── Header ───────────────────────────── -->
    <div class="cc-header" id="cc-drag-handle">
      <div class="cc-header-left">
        <div class="cc-logo">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8s2.91 6.5 6.5 6.5S14.5 11.59 14.5 8 11.59 1.5 8 1.5z" fill="var(--clr-accent)" opacity=".25"/>
            <path d="M8 4.5C6.07 4.5 4.5 6.07 4.5 8S6.07 11.5 8 11.5 11.5 9.93 11.5 8 9.93 4.5 8 4.5z" fill="var(--clr-accent)"/>
          </svg>
        </div>
        <span class="cc-title">Claude Usage</span>
        <div class="cc-live-dot" title="Live"></div>
      </div>
      <div class="cc-header-right">
        <div class="cc-health-pill" title="Health score">
          <span class="cc-health-icon">♥</span>
          <span>${health}%</span>
        </div>
        <button class="cc-btn-icon" id="cc-minimize" title="${_isMinimized ? "Expand" : "Minimize"}">
          ${_isMinimized ? expandIcon() : minimizeIcon()}
        </button>
      </div>
    </div>

    <!-- ── Body ─────────────────────────────── -->
    <div class="cc-body" id="cc-body" style="display:${_isMinimized ? "none" : "block"}">

      <!-- Health bar strip -->
      <div class="cc-healthbar">
        <div class="cc-healthbar-fill" style="width:${health}%"></div>
      </div>

      <!-- ── Rings Row ───────────────────── -->
      <div class="cc-rings-row">
        <div class="cc-ring-card">
          <div class="cc-ring-wrap ring-animate">
            ${buildRing(data.fiveHour, fiveColor)}
          </div>
          <div class="cc-ring-info">
            <div class="cc-ring-label">5-Hour Window</div>
            <div class="cc-ring-reset">↺ ${getTimeLeft(data.fiveHourReset)}</div>
            <div class="cc-badge ${fiveBadge.cls}">${fiveBadge.label}</div>
          </div>
        </div>
        <div class="cc-ring-sep"></div>
        <div class="cc-ring-card">
          <div class="cc-ring-wrap ring-animate">
            ${buildRing(data.week, weekColor)}
          </div>
          <div class="cc-ring-info">
            <div class="cc-ring-label">7-Day Window</div>
            <div class="cc-ring-reset">↺ ${getTimeLeft(data.weekReset)}</div>
            <div class="cc-badge ${weekBadge.cls}">${weekBadge.label}</div>
          </div>
        </div>
      </div>

      <!-- ── Bars Section ────────────────── -->
      <div class="cc-section">
        <div class="cc-section-label">
          <span class="cc-section-icon">◈</span>
          <span>SHORT-TERM</span>
          <span class="cc-section-pct" style="color:var(${fiveColor})">${data.fiveHour}%</span>
        </div>
        ${buildBar(data.fiveHour, fiveColor)}
        ${buildTokenEstimate(data.fiveHour)}
      </div>

      <div class="cc-section">
        <div class="cc-section-label">
          <span class="cc-section-icon">◉</span>
          <span>LONG-TERM</span>
          <span class="cc-section-pct" style="color:var(${weekColor})">${data.week}%</span>
        </div>
        ${buildBar(data.week, weekColor)}
        ${buildTokenEstimate(data.week, 350000)}
      </div>

      <!-- ── Stats Grid ──────────────────── -->
      <div class="cc-stats-grid">
        <div class="cc-stat">
          <div class="cc-stat-icon">⚡</div>
          <div class="cc-stat-val">${rateLabel(data.fiveHour)}</div>
          <div class="cc-stat-key">Rate</div>
        </div>
        <div class="cc-stat">
          <div class="cc-stat-icon">📊</div>
          <div class="cc-stat-val">${trendLabel(data.fiveHour, data.week)}</div>
          <div class="cc-stat-key">Trend</div>
        </div>
        <div class="cc-stat">
          <div class="cc-stat-icon">🕐</div>
          <div class="cc-stat-val">${getTimeLeft(data.fiveHourReset).split(" ")[0]}</div>
          <div class="cc-stat-key">Next Reset</div>
        </div>
        <div class="cc-stat">
          <div class="cc-stat-icon">🛡</div>
          <div class="cc-stat-val">${health > 70 ? "Safe" : health > 40 ? "Warn" : "Low"}</div>
          <div class="cc-stat-key">Status</div>
        </div>
      </div>

      <!-- ── Footer ──────────────────────── -->
      <div class="cc-footer">
        <span>Updated ${nowTs}</span>
        <button class="cc-refresh-btn" id="cc-refresh" title="Refresh now">⟳ Refresh</button>
      </div>
    </div>
  `;

   document.getElementById("cc-minimize").onclick = () => {
    _isMinimized = !_isMinimized;
    renderUI(_lastData);
  };

  document.getElementById("cc-refresh").onclick = async () => {
    const btn = document.getElementById("cc-refresh");
    btn.textContent = "⟳ Loading…";
    btn.disabled = true;
    const fresh = await getUsage();
    if (fresh) renderUI(fresh);
  };

   requestAnimationFrame(() => {
    el.querySelectorAll(".ring-animate .ring-fill").forEach((circle) => {
      circle.style.setProperty(
        "--dash",
        circle.getAttribute("stroke-dasharray").split(" ")[0],
      );
      circle.classList.add("ring-drawn");
    });
    el.querySelectorAll(".bar-fill").forEach((bar) => {
      bar.classList.add("bar-grown");
    });
  });
}

 function injectDragBehavior(el) {
  el.addEventListener("mousedown", (e) => {
    if (!e.target.closest("#cc-drag-handle")) return;
    _isDragging = true;
    _dragOffsetX = e.clientX - el.getBoundingClientRect().left;
    _dragOffsetY = e.clientY - el.getBoundingClientRect().top;
    el.style.transition = "none";
    el.style.cursor = "grabbing";
  });
  document.addEventListener("mousemove", (e) => {
    if (!_isDragging) return;
    el.style.left = `${e.clientX - _dragOffsetX}px`;
    el.style.top = `${e.clientY - _dragOffsetY}px`;
    el.style.right = "auto";
  });
  document.addEventListener("mouseup", () => {
    _isDragging = false;
    if (el) el.style.cursor = "";
  });
}

 function rateLabel(pct) {
  if (pct > 80) return "Heavy";
  if (pct > 50) return "Active";
  if (pct > 20) return "Normal";
  return "Light";
}

function trendLabel(five, week) {
  const diff = five - week;
  if (diff > 20) return "↑ Spike";
  if (diff > 5) return "↗ Rising";
  if (diff < -20) return "↓ Calm";
  if (diff < -5) return "↘ Easing";
  return "→ Steady";
}

function minimizeIcon() {
  return `<svg width="14" height="14" viewBox="0 0 14 14"><line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}

function expandIcon() {
  return `<svg width="14" height="14" viewBox="0 0 14 14"><line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}
