import type { PersonIcon } from "../KilledHeaderMarquee/PersonIcon";

export type PersonRow = [
  string,
  string,
  string,
  number,
  string,
  string,
  number
];

export const kig3FieldIndex = [
  "id",
  "ar_name",
  "en_name",
  "age",
  "dob",
  "sex",
  "update",
] as const;

export type KiG3ColumnKey = Readonly<(typeof kig3FieldIndex)[number]>;

export type PersonIconProps = React.ComponentProps<typeof PersonIcon>;
export type PersonType = PersonIconProps["type"];

export const personHints: Record<PersonType, string> = {
  "elderly-man": "Elderly Men",
  "elderly-woman": "Elderly Women",
  man: "Men",
  woman: "Women",
  boy: "Boys",
  girl: "Girls",
};
