import React from "react";
import styles from "./styles.module.css";
import { ExternalWindowIcon } from "../ExternalWindowIcon";

export const ExternalLinkButton = ({
  children,
  to,
  style,
  buttonType,
}: {
  children: any;
  to: string;
  style?: React.CSSProperties;
  buttonType?: "primary" | "secondary";
}) => {
  return (
    <a href={to} target="_blank" style={style}>
      <span
        className={`button button--${buttonType ?? "primary"} button--lg`}
        style={{ marginBottom: 10 }}
      >
        <span className={styles.buttonText}>{children}</span>{" "}
        <ExternalWindowIcon />
      </span>
    </a>
  );
};
