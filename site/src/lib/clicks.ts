const trackerHost = "https://tfp-click.swj.io";

type ClickName =
  | "killed-name"
  | "killed-name-reload"
  | "chart-slider"
  | "search-btn";

export const trackClick = (name: ClickName, extra?: Record<string, any>) => {
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
