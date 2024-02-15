import shuffle from "lodash/shuffle";
import type { KilledInGaza } from "../../../../types/killed-in-gaza.types";

export const getMergedPages = (
  firstPage: KilledInGaza[],
  secondPage: KilledInGaza[]
) => {
  return shuffle(
    firstPage.reduce(
      (joined, person, idx) =>
        secondPage[idx]
          ? joined.concat([person, secondPage[idx]])
          : joined.concat(person),
      [] as KilledInGaza[]
    )
  );
};
