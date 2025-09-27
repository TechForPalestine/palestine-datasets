import { format } from "date-fns/format";

import { updateDates } from "../../../scripts/data/common/killed-in-gaza/constants";

const lastUpdate = updateDates[updateDates.length - 1];

export const KilledNamesLastUpdateUntilLabel = () => {
  return <span>{format(lastUpdate.includesUntil, "PPP")}</span>;
};
