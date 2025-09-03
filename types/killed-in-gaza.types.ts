export type KilledInGaza = {
  id: string;
  name: string;
  age: number;
  dob: string;
  sex: "m" | "f";
  en_name: string;
  source: "h" | "c";
};

export type KilledInGazaV3 = {
  i: string;
  en: string;
  ar: string;
  a: number;
  b: string;
  g: "m" | "f";
  u: number;
};

export type MarqueePerson = Pick<KilledInGaza, "id" | "name" | "age" | "sex">;
