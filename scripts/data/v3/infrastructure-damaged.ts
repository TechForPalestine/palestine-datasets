import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { SheetTab, fetchGoogleSheet } from "../../utils/gsheets";
import {
  formatDailiesJson,
  validateDailiesJson,
} from "../common/casualties-daily";

const jsonFileName = "infrastructure-damaged.json";

const columnFilter = new Set([
  "report_date",
  "civic_buildings.destroyed",
  "civic_buildings.ext_destroyed",
  "educational_buildings.destroyed",
  "educational_buildings.ext_destroyed",
  "educational_buildings.damaged",
  "educational_buildings.ext_damaged",
  "places_of_worship.mosques_destroyed",
  "places_of_worship.ext_mosques_destroyed",
  "places_of_worship.mosques_damaged",
  "places_of_worship.ext_mosques_damaged",
  "places_of_worship.churches_destroyed",
  "places_of_worship.ext_churches_destroyed",
  "residential.destroyed",
  "residential.ext_destroyed",
]);

const generateJsonFromGSheet = async () => {
  const sheetJson = await fetchGoogleSheet(SheetTab.InfrastructureDamaged);
  const [, headerKeys, ...rows] = sheetJson.values;
  
  const jsonArray = formatInfrastructreJson(headerKeys, rows, columnFilter);
  
  validateJson(jsonArray);

  writeJson(ApiResource.InfrastructureDamagedV3, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName}`);

};

const yyyymmddFormat = /^202[3-4]-[0-1][0-9]-[0-3][0-9]$/;

/**
 * our docs claim fields prefixed with ext_ are non-optional, so we should assert that
 * we should also assert standard date format
 */
export const validateJson = (
  json: Array<Record<string, any>>
) => {
  const uniqueFieldNames = new Set<string>();
  json.forEach((record) => {
    // validate date format is as expected for the base daily dataset format
    const dateValid = yyyymmddFormat.test(record.report_date as string);
    if (!dateValid) {
      throw new Error(
        `Report date '${record.report_date}' is invalid, expected YYYY-MM-DD`
      );
    }

    // track all of the field names we use in the dataset
    Object.keys(record).forEach((key) => uniqueFieldNames.add(key));
  });
  const extKeys = Array.from(uniqueFieldNames).filter((key) =>
    key.startsWith("ext_")
  );
  json.forEach((record) => {
    extKeys.forEach((expectedKey) => {
      if(typeof record[expectedKey] === "object"){
          for(const value in record[expectedKey]){
            if (typeof value !== "string" && typeof value !== "number") {
              throw new Error(
                `Record for ${record.report_date} is missing expected key: ${expectedKey}`
              );
            }
          }
          
        
      }else{
        const value = record[expectedKey];
        if (typeof value !== "string" && typeof value !== "number") {
          throw new Error(
            `Record for ${record.report_date} is missing expected key: ${expectedKey}`
          );
        }
      }
    });
    
  });
      
   
   
};

generateJsonFromGSheet();

const formatInfrastructreJson = (
  headerKeys: string[],
  rows: string[][],
  columnFilter = new Set<string>()
  ) => {

    return rows.reverse().map((rowColumns) =>
    rowColumns.reduce(
      (dayRecord, colValue, colIndex) => ({
        ...dayRecord,
        ...((columnFilter.size && columnFilter.has(headerKeys[colIndex])) ||
        !columnFilter.size
          ? addRecordField(headerKeys[colIndex], colValue, dayRecord)
          : {}),
      }),
      {}
    )
  );
};

const rawValueFields = ["report_date", "report_source"];
const addRecordField = (
  fieldKey: string,
  fieldValue: string,
  record: Record<string, any>
) => {
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


const formatValue = (colValue: string) => {
  // not empty string, coerce into int
  if (colValue) {
    return Number(colValue);
  }

  return undefined;
};
