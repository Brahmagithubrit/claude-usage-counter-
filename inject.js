const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  try {
    const clone = response.clone();
    const text = await clone.text();

    if (text.includes("five_hour") && text.includes("seven_day")) {
      window.postMessage(
        {
          type: "CLAUDE_USAGE",
          payload: text,
        },
        "*",
      );
    }
  } catch {}

  return response;
};
