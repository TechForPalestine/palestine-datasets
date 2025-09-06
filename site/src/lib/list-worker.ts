let count = 0;
const maxFetch = 0;

if (maxFetch) {
  console.warn(`Worker is limiting fetch to ${maxFetch}`);
}

onmessage = (e) => {
  if (typeof global === "undefined") return;

  if (e.data !== "start") return;

  const oboe = require("oboe") as typeof import("oboe");
  oboe({
    url: "https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json",
  })
    .node(".[*][*]", function (data) {
      if (typeof data === "object" && maxFetch && count > maxFetch) {
        this.abort();
        postMessage("done");
        return;
      }

      if (typeof data === "object") {
        postMessage(data);
        count += 1;
      }

      // return oboe.drop;
    })
    .done(() => {
      postMessage("done");
    });
};
