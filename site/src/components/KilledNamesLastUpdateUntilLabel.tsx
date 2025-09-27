import { format } from "date-fns/format";

import { updateDates } from "../../../scripts/data/common/killed-in-gaza/constants";

const lastUpdate = updateDates[updateDates.length - 1];
const isoStringSuffix = `T12:00:00.000Z`;

export const KilledNamesLastUpdateUntilLabel = () => {
  const labelDt = new Date(`${lastUpdate.includesUntil}${isoStringSuffix}`);
  return <span>{format(labelDt, "PPP")}</span>;
};
