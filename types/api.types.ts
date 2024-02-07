// underscore separator for version suffix required for manifest logic
export enum ApiResource {
  CasualtiesDailyV1 = "CasualtiesDaily_V1",
  CasualtiesDailyV2 = "CasualtiesDaily_V2",
  KilledInGazaV1 = "KilledInGaza_V1",
  KilledInGazaV2 = "KilledInGaza_V2",
  KilledInGazaIndexArV2 = "KilledInGazaIndexArV2",
  KilledInGazaIndexEnV2 = "KilledInGazaIndexEnV2",
  SummaryV1 = "Summary_V1",
  SummaryV2 = "Summary_V2",
}
export type ResourceFormat = "minified" | "unminified" | "csv";

export type Manifest = Record<
  ApiResource,
  Partial<
    Record<
      ResourceFormat,
      {
        file: string;
        name: string;
        apiPath: string;
      }
    >
  >
>;
