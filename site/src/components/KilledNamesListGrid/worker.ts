let records = 0;
const maxRecordsToFetch = 0;

if (maxRecordsToFetch) {
  console.warn(`Worker is limiting fetch to ${maxRecordsToFetch}`);
}

onmessage = (e) => {
  if (typeof global === "undefined") return;

  if (e.data !== "start") return;

  const oboe = require("oboe") as typeof import("oboe");
  oboe({
    url: "https://data.techforpalestine.org/api/v3/killed-in-gaza.min.json",
  })
    .node(".[*][*]", function (data) {
      if (
        typeof data === "object" &&
        maxRecordsToFetch &&
        records > maxRecordsToFetch
      ) {
        this.abort();
        postMessage("done");
        return;
      }

      if (typeof data === "object") {
        postMessage(data);
        records += 1;
      }

      // return oboe.drop;
    })
    .done(() => {
      postMessage("done");
    });
};
