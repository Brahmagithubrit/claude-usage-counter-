console.log("CONTENT SCRIPT RUNNING");

async function run() {
  const data = await getUsage();
  console.log("USAGE:", data);

  if (data) renderUI(data);
}

setInterval(run, 5000);
