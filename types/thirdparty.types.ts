declare module "arabic-name-to-en" {
  export default function toEnName(ar: string): string;
}

declare module "point-at-length" {
  export default function pointAtLen(pathData: string): {
    at: (pathLen: number) => [number, number];
  };
}
