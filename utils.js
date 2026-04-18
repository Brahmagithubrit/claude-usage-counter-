 
let ORG_ID = null;
let _pollInterval = null;
const POLL_MS = 60_000;  

 function detectOrgId() {
   const entries = performance.getEntriesByType("resource");
  for (const entry of entries) {
    const match = entry.name.match(/organizations\/([a-z0-9\-]+)/i);
    if (match) {
      ORG_ID = match[1];
      console.debug("[CC] Org ID from resources:", ORG_ID);
      return ORG_ID;
    }
  }

   const pathMatch = location.pathname.match(/organizations\/([a-z0-9\-]+)/i);
  if (pathMatch) {
    ORG_ID = pathMatch[1];
    console.debug("[CC] Org ID from pathname:", ORG_ID);
    return ORG_ID;
  }

   for (const store of [localStorage, sessionStorage]) {
    try {
      for (let i = 0; i < store.length; i++) {
        const val = store.getItem(store.key(i)) || "";
        const m = val.match(/organizations\/([a-z0-9\-]+)/i);
        if (m) {
          ORG_ID = m[1];
          console.debug("[CC] Org ID from storage:", ORG_ID);
          return ORG_ID;
        }
      }
    } catch (_) {
     }
  }

   document
    .querySelectorAll("[data-org-id],[data-organization]")
    .forEach((el) => {
      ORG_ID = el.dataset.orgId || el.dataset.organization || ORG_ID;
    });

  console.debug("[CC] Org ID not found");
  return null;
}

 async function getUsage() {
  if (!ORG_ID) detectOrgId();
  if (!ORG_ID) {
    console.warn("[CC] No Org ID — cannot fetch usage");
    return null;
  }

  try {
    const [usageRes, limitsRes] = await Promise.allSettled([
      fetch(`/api/organizations/${ORG_ID}/usage`),
      fetch(`/api/organizations/${ORG_ID}/limits`),
    ]);

    let base = {};
    if (usageRes.status === "fulfilled" && usageRes.value.ok) {
      base = await usageRes.value.json();
    } else {
      console.warn("[CC] Usage fetch failed");
      return null;
    }

    let limits = {};
    if (limitsRes.status === "fulfilled" && limitsRes.value.ok) {
      limits = await limitsRes.value.json();
    }

    return buildDataObject(base, limits);
  } catch (err) {
    console.error("[CC] Fetch error:", err);
    return null;
  }
}

function buildDataObject(base, limits = {}) {
  const fiveHour = base?.five_hour ?? {};
  const sevenDay = base?.seven_day ?? {};

  return {
    fiveHour: clamp(fiveHour.utilization ?? fiveHour.percent ?? 0),
    week: clamp(sevenDay.utilization ?? sevenDay.percent ?? 0),
    fiveHourReset: fiveHour.resets_at ?? fiveHour.reset_at ?? null,
    weekReset: sevenDay.resets_at ?? sevenDay.reset_at ?? null,

    fiveHourTokens: fiveHour.tokens_used ?? null,
    weekTokens: sevenDay.tokens_used ?? null,
    fiveHourLimit: fiveHour.limit ?? limits?.five_hour ?? null,
    weekLimit: sevenDay.limit ?? limits?.seven_day ?? null,

    fetchedAt: new Date().toISOString(),
  };
}

function clamp(n) {
  return Math.min(100, Math.max(0, Number(n) || 0));
}

function getTimeLeft(resetTime) {
  if (!resetTime) return "Unknown";
  const now = Date.now();
  const reset = new Date(resetTime).getTime();
  const diff = reset - now;

  if (isNaN(diff)) return "Unknown";
  if (diff <= 0) return "Resetting…";

  const totalMins = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  if (days > 0) return `${days}d ${remHours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function startPolling(onData) {
  if (_pollInterval) clearInterval(_pollInterval);

  getUsage().then((d) => {
    if (d) onData(d);
  });

  _pollInterval = setInterval(async () => {
    const d = await getUsage();
    if (d) onData(d);
  }, POLL_MS);

  console.debug("[CC] Polling started every", POLL_MS / 1000, "s");
}

function stopPolling() {
  if (_pollInterval) {
    clearInterval(_pollInterval);
    _pollInterval = null;
  }
}

(function init() {
  detectOrgId();
  startPolling(renderUI);
})();
