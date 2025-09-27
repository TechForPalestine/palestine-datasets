import React from "react";

import styles from "../killedNamesListGrid.module.css";
import { format } from "date-fns/format";
import { updateDates } from "../../../../../scripts/data/common/killed-in-gaza/constants";

const lastUpdate = updateDates[updateDates.length - 1];
const isoStringSuffix = `T12:00:00.000Z`;
const labelDt = new Date(`${lastUpdate.includesUntil}${isoStringSuffix}`);

export const TitleRow = React.memo(() => {
  const untilDate = format(labelDt, "LLLL yyyy");

  return (
    <div className={styles.titleRow}>
      Palestinians Killed in Gaza - October 2023 to {untilDate}
    </div>
  );
});
