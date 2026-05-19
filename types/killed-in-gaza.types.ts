export type KilledInGaza = {
  id: string;
  name: string;
  age: number;
  dob: string;
  sex: "m" | "f";
  en_name: string;
  source: "h" | "c";
  duplicate_ids?: string[];
};

export type MarqueePerson = Pick<KilledInGaza, "id" | "name" | "age" | "sex">;
