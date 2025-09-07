import styles from "../killedNamesListGrid.module.css";

export const ScrollProgress = ({ pct }: { pct: string }) => {
  return (
    <div className={styles.scrollProgress}>
      <div className={styles.scrollProgressBar} style={{ width: pct }} />
    </div>
  );
};
