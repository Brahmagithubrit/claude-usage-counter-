function extractUsage(text) {
  try {
    const json = JSON.parse(text);

    if (json.five_hour && json.seven_day) {
      return {
        fiveHour: json.five_hour.utilization,
        week: json.seven_day.utilization,
      };
    }
  } catch {}

  return null;
}
