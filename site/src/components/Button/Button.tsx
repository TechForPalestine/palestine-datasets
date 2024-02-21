import { CSSProperties } from "react";
import { ExternalWindowIcon } from "../ExternalWindowIcon";
import "./Button.styles.module.css";

type Props = {
  to?: string;
  type: "primary" | "secondary";
  newTab?: boolean;
  children: JSX.Element | string;
  inline?: boolean;
  onClick?: () => any;
};

const styles = {
  base: {
    borderRadius: 8,
    border: "2px solid var(--tfp-button-secondary-fg)",
    padding: "10px 20px",
    fontWeight: "bold",
    textAlign: "center" as const,
    textDecoration: "none",
  },
  primary: {
    borderColor: "var(--tfp-button-primary-bg)",
    backgroundColor: "var(--tfp-button-primary-bg)",
    color: "var(--tfp-button-primary-fg)",
  },
  secondary: {
    backgroundColor: "var(--tfp-button-secondary-bg)",
    color: "var(--tfp-button-secondary-fg)",
  },
  iconContainer: {
    marginLeft: 6,
  },
  inline: {
    display: "inline-block",
  },
  nonLink: {
    cursor: "pointer",
  },
};

const Link = ({
  to,
  onClick,
  children,
  style,
}: {
  to?: string;
  children: any;
  onClick?: () => any;
  style: CSSProperties;
}) => {
  if (to) {
    return (
      <a href={to} style={style}>
        {children}
      </a>
    );
  }

  return <div {...{ onClick, style }}>{children}</div>;
};

export const Button = ({
  to,
  onClick,
  inline,
  type,
  newTab,
  children,
}: Props) => {
  return (
    <Link
      {...{ to, onClick }}
      {...(newTab ? { target: "_blank" } : {})}
      style={{
        ...styles.base,
        ...(inline ? styles.inline : {}),
        ...(onClick ? styles.nonLink : {}),
        ...styles[type],
      }}
    >
      {children}
      {newTab && (
        <span style={styles.iconContainer}>
          <ExternalWindowIcon />
        </span>
      )}
    </Link>
  );
};
