type Props = {
  to: string;
  type: "primary" | "secondary";
  newTab?: boolean;
  children: JSX.Element | string;
};

const styles = {
  base: {
    borderRadius: 8,
    border: "2px solid #222",
    padding: "10px 20px",
    fontWeight: "bold",
    textDecoration: "none",
  },
  primary: {
    borderColor: "#29784c",
    backgroundColor: "#29784c",
    color: "#EEE",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "#222",
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
    </a>
  );
};
