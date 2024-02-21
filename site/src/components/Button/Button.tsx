import { ExternalWindowIcon } from "../ExternalWindowIcon";
import "./Button.styles.module.css";

type Props = {
  to: string;
  type: "primary" | "secondary";
  newTab?: boolean;
  children: JSX.Element | string;
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
};

export const Button = ({ to, type, newTab, children }: Props) => {
  return (
    <a
      href={to}
      {...(newTab ? { target: "_blank" } : {})}
      style={{ ...styles.base, ...styles[type] }}
    >
      {children}
      {newTab && (
        <span style={styles.iconContainer}>
          <ExternalWindowIcon />
        </span>
      )}
    </a>
  );
};
