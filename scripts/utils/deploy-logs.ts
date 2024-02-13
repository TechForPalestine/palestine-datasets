/**
 * method for getting deployment logs from the cloudflare git integration
 */

const aId = process.env.TFP_CF_AID;
const key = process.env.TFP_CF_KEY;
const deploymentId = process.argv.slice().pop();

const run = async () => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${aId}/pages/projects/palestine-numbers/deployments/${deploymentId}/history/logs`,
    {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    }
  );

  if (!response.ok || response.status !== 200) {
    console.log(
      response.ok
        ? `response not ok (${response.status})`
        : `unexpected response status ${response.status}`
    );
    process.exit(1);
  }

  const json = await response.json();
  if (!Array.isArray(json?.result?.data)) {
    console.log("unexpected response body format");
    process.exit(1);
  }

  const lines = json.result.data
    .map(({ ts, line }: { ts: string; line: string }) => `${ts}: ${line}`)
    .join("\n");

  console.log(lines);
};

if (!deploymentId || /^[a-z0-9A-Z]+/.test(deploymentId) === false) {
  console.log(`unexpected deployment id provided: ${deploymentId}`);
  process.exit(1);
}

if (!aId || !key) {
  console.log("TFP_CF_AID or TFP_CF_KEY not provided, but both are required");
  process.exit(1);
}

run();
