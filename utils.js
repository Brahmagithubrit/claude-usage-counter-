let ORG_ID = null;

function detectOrgId() {
  const entries = performance.getEntriesByType("resource");

  for (const entry of entries) {
    const match = entry.name.match(/organizations\/([a-z0-9-]+)/i);
    if (match) {
      ORG_ID = match[1];
      console.log("ORG ID FOUND:", ORG_ID);
      return ORG_ID;
    }
  }

  return null;
}

async function getUsage() {
  if (!ORG_ID) detectOrgId();

  if (!ORG_ID) {
    console.log("ORG ID STILL NOT FOUND");
    return null;
  }

  try {
    const res = await fetch(`/api/organizations/${ORG_ID}/usage`);
    const json = await res.json();

    return {
      fiveHour: json.five_hour.utilization,
      week: json.seven_day.utilization,
    };
  } catch (e) {
    console.log("FETCH FAILED");
    return null;
  }
}
