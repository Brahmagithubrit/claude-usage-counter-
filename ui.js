function renderUI(data) {
  let el = document.getElementById("claude-counter");

  if (!el) {
    el = document.createElement("div");
    el.id = "claude-counter";
    el.style.position = "fixed";
    el.style.top = "10px";
    el.style.right = "10px";
    el.style.zIndex = "9999";
    el.style.background = "#111";
    el.style.color = "#fff";
    el.style.padding = "10px";
    el.style.borderRadius = "8px";
    el.style.width = "200px";
    document.body.appendChild(el);
  }

  el.innerHTML = `
    <div>5h: ${data.fiveHour}%</div>
    <div style="background:#333;height:6px;">
      <div style="width:${data.fiveHour}%;background:lime;height:6px;"></div>
    </div>

    <div style="margin-top:6px;">Week: ${data.week}%</div>
    <div style="background:#333;height:6px;">
      <div style="width:${data.week}%;background:orange;height:6px;"></div>
    </div>
  `;
}
