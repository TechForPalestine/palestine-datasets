import clsx from "clsx";
import styles from "./ScrollArrowIcon.module.css";

export const ScrollArrowIcon = ({ down = false, size = 48, end = false }) => {
  return (
    // License: Apache. Made by bytedance: https://github.com/bytedance/IconPark
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(down ? styles.down : styles.up)}
    >
      <path
        d="M14 12L26 24L14 36"
        stroke="#000000"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {end && (
        <path
          d="M34 12V36"
          stroke="#000000"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
