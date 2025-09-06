import { kig3FieldIndex, PersonRow } from "./types";

type WorkerInputs = {
  onRecord: (data: PersonRow) => void;
  onFinished: () => void;
};

export const startWorker = ({ onRecord, onFinished }: WorkerInputs) => {
  if (typeof Worker === "undefined" || typeof window === "undefined") {
    console.log("workers are not supported in this environment");
  }
  const worker = new Worker(new URL("./worker.ts", import.meta.url));
  worker.onmessage = (event) => {
    if (event.data === "done") {
      onFinished();
      return;
    }

    if (
      !event.data ||
      typeof event.data !== "object" ||
      event.data.length !== kig3FieldIndex.length
    ) {
      return;
    }

    if (event.data.every((val) => typeof val === "string")) {
      return;
    }

    onRecord(event.data);
  };
  worker.postMessage("start");
};
