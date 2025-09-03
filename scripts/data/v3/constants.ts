export const kig3ColMapping = {
  id: "i",
  en_name: "en",
  name: "ar",
  age: "a",
  dob: "b",
  sex: "g",
  update: "u",
};

export const invertedKig3ColMapping = Object.entries(kig3ColMapping).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>
);
