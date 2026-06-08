import React, { useState } from "react";
import clsx from "clsx";
import styles from "../killedNamesListGrid.module.css";
import { CancelCircleIcon } from "../../CancelCircleIcon";
import { AgeRange } from "../urlParams";

export const AgeRangeModal = React.memo(
  ({
    initialRange,
    onConfirm,
    onDismiss,
  }: {
    initialRange: AgeRange;
    onConfirm: (range: [number, number]) => void;
    onDismiss: () => void;
  }) => {
    const [min, setMin] = useState(initialRange ? String(initialRange[0]) : "");
    const [max, setMax] = useState(initialRange ? String(initialRange[1]) : "");
    const [error, setError] = useState<string | null>(null);

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const minNum = parseInt(min, 10);
      const maxNum = parseInt(max, 10);
      if (!Number.isFinite(minNum) || !Number.isFinite(maxNum) || minNum < 0 || maxNum < 0) {
        setError("Enter whole numbers for both min and max age.");
        return;
      }
      if (minNum > maxNum) {
        setError("Min age must be less than or equal to max age.");
        return;
      }
      onConfirm([minNum, maxNum]);
    };

    return (
      <div className={clsx(styles.gridOverlay, styles.printModal)}>
        <form className={styles.printModalContainer} onSubmit={onSubmit}>
          <h3 className={styles.printModalTitle}>Filter by age range</h3>
          <p className={styles.printModalBlurb}>
            Show records within an inclusive age range. This replaces the current age group
            selections.
          </p>
          <div className={styles.ageRangeInputs}>
            <label className={styles.ageRangeInputLabel}>
              <span>Min age</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                autoFocus
              />
            </label>
            <label className={styles.ageRangeInputLabel}>
              <span>Max age</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </label>
          </div>
          {error && <div className={styles.ageRangeError}>{error}</div>}
          <button type="submit" className={styles.printModalButton}>
            Apply range
          </button>
          <div
            className={styles.dismissFocusedRecord}
            onClick={onDismiss}
            role="button"
            aria-label="Close age range dialog"
          >
            <CancelCircleIcon size={34} />
          </div>
        </form>
      </div>
    );
  },
);
