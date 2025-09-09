import React from "react";

import styles from "../killedNamesListGrid.module.css";

export const TitleRow = React.memo(() => {
  return (
    <div className={styles.titleRow}>
      Palestinians Killed in Gaza since October 2023
    </div>
  );
});
