function renderUI(data) {
  let el = document.getElementById("claude-counter");

  if (!el) {
    el = document.createElement("div");
    el.id = "claude-counter";
    document.body.appendChild(el);
  }

  el.innerHTML = `
    <div class="counter-label">5h Usage: ${data.fiveHour}%</div>
    <div class="counter-bar">
      <div class="counter-fill-5h" style="width:${data.fiveHour}%"></div>
    </div>

    <div class="counter-label">Weekly Usage: ${data.week}%</div>
    <div class="counter-bar">
      <div class="counter-fill-week" style="width:${data.week}%"></div>
    </div>
  `;
}
