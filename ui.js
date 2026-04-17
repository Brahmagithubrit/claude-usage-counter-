function renderUI(data) {
  let el = document.getElementById("claude-counter");

  if (!el) {
    el = document.createElement("div");
    el.id = "claude-counter";
    document.body.appendChild(el);
  }

  el.innerHTML = `
    <div>5h: ${data.fiveHour}%</div>
    <div>Week: ${data.week}%</div>
  `;
}
