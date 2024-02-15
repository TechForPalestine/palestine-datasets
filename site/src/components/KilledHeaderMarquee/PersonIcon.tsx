export const PersonIcon = ({
  type,
}: {
  type: "elderly-man" | "elderly-woman" | "man" | "woman" | "boy" | "girl";
}) => {
  switch (type) {
    case "elderly-man":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.5 5.25C13.6 5.25 14.5 4.35 14.5 3.25C14.5 2.15 13.6 1.25 12.5 1.25C11.4 1.25 10.5 2.15 10.5 3.25C10.5 4.35 11.4 5.25 12.5 5.25ZM19 12.25V22.75H18V12.25C18 11.97 17.78 11.75 17.5 11.75C17.22 11.75 17 11.97 17 12.25V13.25H16V12.56C14.54 12.18 13.3 11.27 12.49 10.04C12.18 10.91 12 11.82 12 12.75C12 12.98 12.02 13.21 12.03 13.44L14 16.25V22.75H12V17.75L10.22 15.21L10 18.75L7 22.75L5.4 21.55L8 18.08V12.75C8 11.6 8.18 10.46 8.5 9.36L7 10.21V13.75H5V9.05L10.4 5.98V5.99C10.99 5.68 11.72 5.66 12.34 6.02C12.7 6.23 12.97 6.53 13.14 6.87L13.93 8.54C14.58 9.85 15.94 10.75 17.5 10.75C18.33 10.75 19 11.42 19 12.25Z"
            fill="black"
          />
        </svg>
      );
    case "elderly-woman":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.5 11C15.94 11 14.58 10.1 13.92 8.79L13.13 7.12C13.12 7.1 12.63 6 11.34 6C7.72 6 5 16.69 5 19H7.5L5.4 21.8L7 23L10 19H12V23H14V18.97L12 13L12.49 10.29C13.3 11.52 14.54 12.43 16 12.81V13.5H17V12.5C17 12.22 17.22 12 17.5 12C17.78 12 18 12.22 18 12.5V23H19V12.5C19 11.67 18.33 11 17.5 11Z"
            fill="black"
          />
          <path
            d="M10.6 2.91C10.54 3.1 10.5 3.29 10.5 3.5C10.5 4.6 11.4 5.5 12.5 5.5C13.6 5.5 14.5 4.6 14.5 3.5C14.5 2.4 13.6 1.5 12.5 1.5C12.29 1.5 12.1 1.54 11.91 1.6C11.76 1.25 11.41 1 11 1C10.45 1 10 1.45 10 2C10 2.41 10.25 2.76 10.6 2.91Z"
            fill="black"
          />
        </svg>
      );
    case "man":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 7H10C8.9 7 8 7.9 8 9V15H10V22H14V15H16V9C16 7.9 15.1 7 14 7Z"
            fill="black"
          />
          <path
            d="M12 6C13.1046 6 14 5.10457 14 4C14 2.89543 13.1046 2 12 2C10.8954 2 10 2.89543 10 4C10 5.10457 10.8954 6 12 6Z"
            fill="black"
          />
        </svg>
      );
    case "woman":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.94 8.31C13.62 7.52 12.85 7 12 7C11.15 7 10.38 7.52 10.06 8.31L7 16H10V22H14V16H17L13.94 8.31Z"
            fill="black"
          />
          <path
            d="M12 6C13.1046 6 14 5.10457 14 4C14 2.89543 13.1046 2 12 2C10.8954 2 10 2.89543 10 4C10 5.10457 10.8954 6 12 6Z"
            fill="black"
          />
        </svg>
      );
    case "boy":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 7.5C12.97 7.5 13.75 6.72 13.75 5.75C13.75 4.78 12.97 4 12 4C11.03 4 10.25 4.78 10.25 5.75C10.25 6.72 11.03 7.5 12 7.5ZM14 20V15H15V10.5C15 9.4 14.1 8.5 13 8.5H11C9.9 8.5 9 9.4 9 10.5V15H10V20H14Z"
            fill="black"
          />
        </svg>
      );
    case "girl":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 7.5C12.97 7.5 13.75 6.72 13.75 5.75C13.75 4.78 12.97 4 12 4C11.03 4 10.25 4.78 10.25 5.75C10.25 6.72 11.03 7.5 12 7.5ZM14 16V20H10V16H8L10.38 9.62C10.63 8.95 11.28 8.5 12 8.5C12.72 8.5 13.37 8.95 13.62 9.62L16 16H14Z"
            fill="black"
          />
        </svg>
      );
    default:
      return null;
  }
};

export type PersonIconType = React.ComponentProps<typeof PersonIcon>["type"];
