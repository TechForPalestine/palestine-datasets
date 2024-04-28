export type KilledInGaza = {
  id: string;
  name: string;
  age: number;
  dob: string;
  sex: "m" | "f";
  en_name: string;
  source: "h" | "c";
};

export type MarqueePerson = Pick<KilledInGaza, "id" | "name" | "age" | "sex">;
