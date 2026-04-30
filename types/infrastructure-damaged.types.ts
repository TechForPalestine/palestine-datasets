export type InfrastructureDamagedCivicBuildings = {
  ext_destroyed?: number;
  ext_damaged?: number;
};

export type InfrastructureDamagedEducationalBuildings = {
  ext_destroyed?: number;
  ext_damaged?: number;
};

export type InfrastructureDamagedPlacesOfWorship = {
  ext_mosques_destroyed?: number;
  ext_mosques_damaged?: number;
  ext_churches_destroyed?: number;
  ext_churches_damaged?: number;
};

export type InfrastructureDamagedResidential = {
  ext_destroyed?: number;
  ext_damaged?: number;
};

export type InfrastructureDamagedV3 = {
  report_date: string;
  civic_buildings?: InfrastructureDamagedCivicBuildings;
  educational_buildings?: InfrastructureDamagedEducationalBuildings;
  places_of_worship?: InfrastructureDamagedPlacesOfWorship;
  residential?: InfrastructureDamagedResidential;
};

export type InfrastructureDamagedRecord = Record<string, InfrastructureDamagedV3>;
