import { PersonIconType } from "../components/KilledHeaderMarquee/PersonIcon";

export const sexIsValid = (sex: string): sex is "m" | "f" => {
  return ["f", "m"].includes(sex as any);
};

export const iconTypeForPerson = (
  age: number,
  sex: "m" | "f"
): PersonIconType => {
  if (age >= 65) {
    return sex === "f" ? "elderly-woman" : "elderly-man";
  }

  if (age < 18) {
    return sex === "f" ? "girl" : "boy";
  }

  return sex === "f" ? "woman" : "man";
};
