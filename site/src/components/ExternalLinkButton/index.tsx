import React from "react";
import styles from "./styles.module.css";

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
  const externalWindowIcon = (
    <svg
      width="13.5"
      height="13.5"
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="iconExternalLink_node_modules-@docusaurus-theme-classic-lib-theme-Icon-ExternalLink-styles-module"
    >
      <path
        fill="currentColor"
        d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"
      ></path>
    </svg>
  );

  return (
    <a href={to} target="_blank" style={style}>
      <span
        className={`button button--${buttonType ?? "primary"} button--lg`}
        style={{ marginBottom: 10 }}
      >
        <span className={styles.buttonText}>{children}</span>{" "}
        {externalWindowIcon}
      </span>
    </a>
  );
};
