import { execSync } from "child_process";

const apiKey = process.env.KEY ?? "";
const token = process.env.TOKEN ?? "";

const getUploadUrl = async () => {
  const response = await fetch("https://pdf-services.adobe.io/assets", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mediaType: "application/pdf",
    }),
  });
  if (!response.ok || response.status > 299) {
    throw new Error(`Failed to get upload url (${response.status})`);
  }
  const data = await response.json();
  return data as { uploadUri: string; assetID: string };
};

const uploadFile = async (filepath: string, uploadUrl: string) => {
  execSync(
    `curl --location -g --request PUT '${uploadUrl}' --header 'Content-Type: application/pdf' --data-binary '@${filepath}'`
  );
};

const makePayload = (assetID: string) => ({
  assetID,
  getCharBounds: false,
  includeStyling: false,
  elementsToExtract: ["tables"],
  tableOutputFormat: "csv",
  renditionsToExtract: ["tables"],
  notifiers: [],
});

const startExtraction = async (assetID: string) => {
  const response = await fetch(
    `https://pdf-services.adobe.io/operation/extractpdf`,
    {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(makePayload(assetID)),
    }
  );
  if (!response.ok || response.status >= 400) {
    throw new Error(`Failed to start extraction (${response.status})`);
  }
  return response.headers.get("Location") || response.headers.get("location");
};

const downloadFile = async (fileUrl: string) => {
  console.log("downloading...");
  execSync(`wget '${fileUrl}'`, { stdio: "inherit" });
};

const pollForExtraction = async (
  pollUrl: string
): Promise<boolean | undefined> => {
  console.log("polling...");
  const response = await fetch(pollUrl, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (data.status === "in progress") {
    console.log("in progress... waiting 10 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    return pollForExtraction(pollUrl);
  } else if (data.status === "done") {
    console.log("done! >> ", data);
    await downloadFile(data.resource.downloadUri);
    return true;
  } else {
    console.error("Unrecognized poll response:");
    console.error(data);
    return false;
  }
};

const files: string[] = [
  // ie:
  // "./pdfs/181_20240329gaza.pdf",
];

const run = async () => {
  for (const file of files) {
    console.log(`Processing ${file}`);
    const { uploadUri, assetID } = await getUploadUrl();
    console.log(`Uploading ${file} (${assetID})`);
    await uploadFile(file, uploadUri);
    console.log(`Starting extraction for ${file}`);
    const pollUrl = await startExtraction(assetID);
    if (!pollUrl) {
      console.error("No pollUrl returned! Ending");
      return;
    }
    console.log(`Polling for extraction for ${file}`);
    const downloaded = await pollForExtraction(pollUrl);
    if (downloaded === false) {
      console.error("Failed to extract & download file, aborting.");
      return;
    }
    console.log(`Finished ${file}! waiting 15 seconds...`);
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }
};

run();
