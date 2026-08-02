const formatValue = (colValue: string) => {
  // not empty string, coerce into int
  if (colValue) {
    return Number(colValue);
  }

  return undefined;
};

const rawValueFields = ["report_date", "report_source", "flash_source"];
const addRecordField = (fieldKey: string, fieldValue: string, record: Record<string, any>) => {
  const rawValue = rawValueFields.includes(fieldKey);
  const isObjectValue = fieldKey.includes(".");
  if (isObjectValue && fieldValue) {
    const [objFieldKey, valueFieldKey] = fieldKey.split(".");
    return {
      [objFieldKey]: {
        ...record[objFieldKey],
        [valueFieldKey]: formatValue(fieldValue),
      },
    };
  }
  return {
    [fieldKey]: rawValue ? fieldValue : formatValue(fieldValue),
  };
};

/**
 * turns spreadsheet row / col arrays into an array of objects for each report date
 * @param headerKeys the row with valid json object keys in the spreadsheet header
 * @param rows spreadsheet rows for each report date with column values to reduce into a report object
 * @returns array of daily report objects
 */
export const formatDailiesJson = (
  headerKeys: string[],
  rows: string[][],
  columnFilter = new Set<string>(),
) => {
  return rows.reverse().map((rowColumns) =>
    rowColumns.reduce(
      (dayRecord, colValue, colIndex) => ({
        ...dayRecord,
        ...((columnFilter.size && columnFilter.has(headerKeys[colIndex])) || !columnFilter.size
          ? addRecordField(headerKeys[colIndex], colValue, dayRecord)
          : {}),
      }),
      {},
    ),
  );
};

const yyyymmddFormat = /^202[3-9]-[0-1][0-9]-[0-3][0-9]$/;

/**
 * our docs claim fields prefixed with ext_ are non-optional, so we should assert that
 * we should also assert standard date format. Every numeric field is a count
 * (casualties, a cumulative, or a reporting period) so none can be negative — a
 * negative value means an upstream regression produced a bad derived delta (e.g.
 * a cumulative that dropped). This is the last line of defense on the derived
 * dataset, after the source-data gates in validate.ts.
 */
export const validateDailiesJson = (json: Array<Record<string, number | string>>) => {
  const uniqueFieldNames = new Set<string>();
  json.forEach((record) => {
    // validate date format is as expected for the base daily dataset format
    const dateValid = yyyymmddFormat.test(record.report_date as string);
    if (!dateValid) {
      throw new Error(`Report date '${record.report_date}' is invalid, expected YYYY-MM-DD`);
    }

    // no count in these datasets can be negative
    Object.entries(record).forEach(([key, value]) => {
      if (typeof value === "number" && value < 0) {
        throw new Error(`Record for ${record.report_date} has negative ${key}: ${value}`);
      }
    });

    // track all of the field names we use in the dataset
    Object.keys(record).forEach((key) => uniqueFieldNames.add(key));
  });
  const extKeys = Array.from(uniqueFieldNames).filter((key) => key.startsWith("ext_"));
  json.forEach((record) => {
    extKeys.forEach((expectedKey) => {
      const value = record[expectedKey];
      if (typeof value !== "string" && typeof value !== "number") {
        throw new Error(`Record for ${record.report_date} is missing expected key: ${expectedKey}`);
      }
    });
  });
};
