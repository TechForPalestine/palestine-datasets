import React, { useMemo, useState } from "react";
import clsx from "clsx";
import styles from "../killedNamesListGrid.module.css";
import { CancelCircleIcon } from "../../CancelCircleIcon";

type Tranche = { start: number; end: number };

export const PrintModal = React.memo(
  ({
    total,
    trancheSize,
    onPrintRange,
    onDismiss,
  }: {
    total: number;
    trancheSize: number;
    onPrintRange: (startIdx: number, endIdx: number, detailed: boolean) => void;
    onDismiss: () => void;
  }) => {
    const [detailed, setDetailed] = useState(false);

    const tranches = useMemo<Tranche[]>(() => {
      const out: Tranche[] = [];
      for (let start = 0; start < total; start += trancheSize) {
        out.push({ start, end: Math.min(total, start + trancheSize) });
      }
      return out;
    }, [total, trancheSize]);

    const needsTranching = total > trancheSize;

    return (
      <div className={clsx(styles.gridOverlay, styles.printModal)}>
        <div className={styles.printModalContainer}>
          <h3 className={styles.printModalTitle}>
            Print {total.toLocaleString()} names
          </h3>
          <p className={styles.printModalBlurb}>
            {needsTranching
              ? "This list is too large for most browsers to print as one document. Print each batch below in its own tab."
              : "A new tab will open and the print dialog will appear automatically."}
          </p>

          {needsTranching ? (
            <ul className={styles.printModalList}>
              {tranches.map(({ start, end }) => (
                <li key={start}>
                  <button
                    type="button"
                    className={styles.printModalButton}
                    onClick={() => onPrintRange(start, end, detailed)}
                  >
                    Print names {(start + 1).toLocaleString()}–
                    {end.toLocaleString()}
                    <span className={styles.printModalButtonCount}>
                      {(end - start).toLocaleString()} records
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <button
              type="button"
              className={styles.printModalButton}
              onClick={() => onPrintRange(0, total, detailed)}
            >
              Print {total.toLocaleString()} names
            </button>
          )}

          <label className={styles.printModalToggle}>
            <div>
              <input
                type="checkbox"
                checked={detailed}
                onChange={(e) => setDetailed(e.target.checked)}
              />
            </div>
            <span>
              Include Arabic name, sex, age, and date of birth
              <span className={styles.printModalToggleHint}>
                {detailed
                  ? "(Detailed table — more pages)"
                  : "(Compact two-column names list — fewer pages)"}
              </span>
            </span>
          </label>

          <div
            className={styles.dismissFocusedRecord}
            onClick={onDismiss}
            role="button"
            aria-label="Close print dialog"
          >
            <CancelCircleIcon size={34} />
          </div>
        </div>
      </div>
    );
  },
);
