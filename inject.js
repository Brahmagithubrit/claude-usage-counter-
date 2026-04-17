console.log("INJECT LOADED");

const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();

  for (const entry of entries) {
    const url = entry.name;

    if (url.includes("usage")) {
      console.log("USAGE REQUEST FOUND:", url);

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          console.log("USAGE DATA:", data);

          window.postMessage(
            {
              type: "CLAUDE_USAGE",
              payload: JSON.stringify(data),
            },
            "*",
          );
        })
        .catch((err) => console.log("FETCH ERROR"));
    }
  }
});

observer.observe({ entryTypes: ["resource"] });
