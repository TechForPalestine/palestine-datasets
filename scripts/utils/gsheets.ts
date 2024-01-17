const gsheetsKey = process.env.GSHEETS_KEY;

// worksheet currently owned by @sterlingwes
const sheetId = "1UuWRD602kUFyYbw-e6eJ3PaOGlyfMvwMBJW9zdGOO8g";

export enum SheetTab {
  CasualtiesDaily = "casualties_daily",
  MartyrsList = "martyrs",
}

type GSheetsResponse = {
  values: string[][]; // array of rows with array of column values
};

export const fetchGoogleSheet = async (sheetTab: SheetTab) => {
  const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetTab}?alt=json&key=${gsheetsKey}`;
  const response = await fetch(sheetUrl);
  return response.json() as Promise<GSheetsResponse>;
};
