import styles from "./styles.module.css";

export const DocWarningBubble = ({ children }: { children: string }) => {
  return (
    <div className={styles.bubble}>
      <div>
        <svg width="88" height="76" viewBox="0 0 88 76" fill="none">
          <path
            d="M0 76H88L44 0L0 76ZM48 64H40V56H48V64ZM48 48H40V32H48V48Z"
            fill="black"
          />
        </svg>
      </div>
      <div>{children}</div>
    </div>
  );
};
