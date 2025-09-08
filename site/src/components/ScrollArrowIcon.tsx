export const ScrollArrowIcon = ({ rotate = 90, size = 48, end = false }) => {
  let translate = "translate(0, 0)";

  if (!end && rotate === 270) {
    translate = `translate(${(size / 48) * 3}, 0)`;
  }

  if (!end && rotate === 90) {
    translate = `translate(${(size / 48) * 5}, 0)`;
  }

  return (
    // License: Apache. Made by bytedance: https://github.com/bytedance/IconPark
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      transform={`rotate(${rotate}) ${translate}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 12L26 24L14 36"
        stroke="#000000"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      {end && (
        <path
          d="M34 12V36"
          stroke="#000000"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      )}
    </svg>
  );
};
