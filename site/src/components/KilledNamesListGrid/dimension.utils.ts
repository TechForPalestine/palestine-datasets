type Dimension = { width: number; height: number };

const mobileThreshold = 0.15; // 15% height change

export const hasMobileToolbarDimensionChange = ({
  before,
  after,
}: {
  before: Dimension;
  after: Dimension;
}) => {
  if (!before.width) {
    return false;
  }

  if (before.width !== after.width) {
    return false;
  }

  const heightChange = Math.abs(before.height - after.height);

  return heightChange / before.height < mobileThreshold;
};
