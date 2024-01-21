export enum SheetTab {
  CasualtiesDaily = "casualties_daily",
  KilledInGaza = "martyrs",
}

type GSheetsResponse = {
  values: string[][]; // array of rows with array of column values
};

const token = process.env.TFP_SHEET_KEY ?? "";

export const fetchGoogleSheet = async (sheetTab: SheetTab) => {
  const sheetUrl = `https://tfp.fediship.workers.dev/?tab=${sheetTab}`;
  if (!token) {
    throw new Error(
      "fetchGoogleSheet requires TFP_SHEET_KEY to be defined (which it should be in CI)"
    );
  }
  const response = await fetch(sheetUrl, {
    headers: { "x-token": token },
  });

  if (!response.ok || response.status !== 200) {
    throw new Error(
      `Failed to fetch worksheet "${sheetTab}", received ${response.status}`
    );
  }

  return response.json() as Promise<GSheetsResponse>;
};
