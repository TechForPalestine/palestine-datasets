const trackerHost = "https://tfp-click.swj.io";

export const trackClick = (name: string, extra?: Record<string, any>) => {
  const url = window.location.href;
  const body = JSON.stringify({
    name,
    extra: JSON.stringify({ ...extra, url }),
  });
  fetch(trackerHost, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch((e) => {
    // no-op, safe to ignore
  });
};
