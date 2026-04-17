const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data.type === "CLAUDE_USAGE") {
    handleUsage(event.data.payload);
  }
});

function handleUsage(text) {
    const data = extractUsage(text)
    if (data) renderUI(data)
}