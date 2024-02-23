// underscore separator for version suffix required for manifest logic
export enum ApiResource {
  CasualtiesDailyV1 = "CasualtiesDaily_V1",
  CasualtiesDailyV2 = "CasualtiesDaily_V2",
  KilledInGazaV1 = "KilledInGaza_V1",
  KilledInGazaV2 = "KilledInGaza_V2",
  KilledInGazaDerivedV2 = "KilledInGazaDerived_V2",
  SummaryV1 = "Summary_V1",
  SummaryV2 = "Summary_V2",
  SummaryV3 = "Summary_V3",
  WestBankDailyV2 = "WestBankDaily_V2",
}
export type ResourceFormat = "minified" | "unminified" | "csv" | "raw";

type ManifestFile = {
  file: string;
  name: string;
  apiPath: string;
};

type ManifestFolder = {
  folder: string;
  apiPath: string;
};

export type Manifest = Partial<
  Record<
    ApiResource,
    {
      minified?: ManifestFile;
      unminified?: ManifestFile;
      csv?: ManifestFile;
      raw?: ManifestFolder;
    }
  >
>;
