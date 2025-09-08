import React from "react";

import styles from "../killedNamesListGrid.module.css";
import { Spinner } from "../../Spinner";

export const TitleRow = React.memo(({ loading }: { loading: boolean }) => {
  return (
    <div className={styles.titleRow}>
      <div>Palestinians Killed in Gaza since October 2023</div>
      <div className={styles.statusRowSpinner}>
        {loading && <Spinner colorMode="dark" />}
      </div>
    </div>
  );
});
