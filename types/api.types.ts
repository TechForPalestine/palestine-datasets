// underscore separator for version suffix required for manifest logic
export enum ApiResource {
  CasualtiesDailyV1 = "CasualtiesDaily_V1",
  KilledInGazaV1 = "KilledInGaza_V1",
  KilledInGazaV2 = "KilledInGaza_V2",
  SummaryV1 = "Summary_V1",
}
export type ResourceFormat = "minified" | "unminified";

export type Manifest = Record<
  ApiResource,
  Record<
    ResourceFormat,
    {
      file: string;
      name: string;
      apiPath: string;
    }
  >
>;
