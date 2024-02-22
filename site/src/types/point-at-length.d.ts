declare module "point-at-length" {
  export default function pointAtLen(pathData: string): {
    at: (pathLen: number) => [number, number];
  };
}
