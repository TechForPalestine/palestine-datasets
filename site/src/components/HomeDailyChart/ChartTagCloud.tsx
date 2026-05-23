import { useRef, useEffect, useState, useCallback } from "react";
import chartData from "@site/src/generated/daily-chart.json";
import styles from "./HomeDailyChart.styles.module.css";

/**
 * Compute available width fraction at a given SVG y-coordinate.
 *
 * The chart line goes from bottom-left (y≈300, x≈0) to top-right (y≈0, x≈1000).
 * At a given y level, the available horizontal space for tags (to the left of
 * the chart line) is the x-coordinate where the line crosses that y.
 *
 * Returns a value between 0 (no space) and 1 (full width available).
 */
function getAvailableWidthAtSvgY(svgY: number): number {
  const { dayPoints, width: svgW, height: svgH } = chartData;

  if (svgY <= 0) return 1;
  if (svgY >= svgH) return 0;

  for (let i = 0; i < dayPoints.length - 1; i++) {
    const [x1, y1] = dayPoints[i];
    const [x2, y2] = dayPoints[i + 1];

    // Check if svgY falls between y1 and y2 (chart is generally monotonic
    // in y but may have small wiggles)
    if ((y1 >= svgY && y2 <= svgY) || (y1 <= svgY && y2 >= svgY)) {
      const dy = y2 - y1;
      const t = Math.abs(dy) > 0.001 ? (svgY - y1) / dy : 0;
      return (x1 + t * (x2 - x1)) / svgW;
    }
  }

  return 1;
}

export interface TagItem {
  key: string;
  node: React.ReactNode;
}

interface RowData {
  tags: TagItem[];
  maxWidthPct: number;
}

const TAG_HEIGHT_PX = 30;
const SAFETY_FACTOR = 0.88;

/**
 * ChartTagCloud renders stat tags in the empty triangular space above the
 * chart line. On desktop, it measures each tag's width and distributes them
 * into rows whose max-width is derived from the actual chart data (via
 * dayPoints), creating a data-aware layout that follows the chart's shape.
 * On mobile, it falls back to simple flex-wrap.
 */
export const ChartTagCloud: React.FC<{
  tags: TagItem[];
}> = ({ tags }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [layoutRows, setLayoutRows] = useState<RowData[] | null>(null);
  const [desktop, setDesktop] = useState(false);

  // Detect desktop vs mobile (matches CSS media query at 500px)
  useEffect(() => {
    const check = () => {
      const isDesktop = typeof window === "object" && window.innerWidth > 500;
      setDesktop(isDesktop);
      if (!isDesktop) {
        setLayoutRows(null);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Reset layout when tags change
  useEffect(() => {
    setLayoutRows(null);
  }, [tags]);

  // Compute data-aware row layout on desktop
  const computeLayout = useCallback(() => {
    if (!desktop || !measureRef.current || tags.length === 0) {
      return;
    }

    const container = measureRef.current;
    const containerWidth = container.offsetWidth;
    if (containerWidth === 0) return;

    // Measure each tag's rendered width
    const tagWidths: number[] = [];
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement;
      tagWidths.push(child.offsetWidth + 5); // 5px margin-right
    }

    // SVG rendered height = containerWidth × (svgHeight / svgWidth)
    const svgAspect = chartData.height / chartData.width;
    const renderedSvgHeight = containerWidth * svgAspect;

    // For a given row index, compute the max available width in pixels
    const getRowMaxWidthPx = (row: number): number => {
      const rowCenterY = (row + 0.5) * TAG_HEIGHT_PX;
      const rowSvgY = (rowCenterY / renderedSvgHeight) * chartData.height;
      return getAvailableWidthAtSvgY(rowSvgY) * containerWidth * SAFETY_FACTOR;
    };

    // Distribute tags into rows
    const rows: RowData[] = [];
    let currentTags: TagItem[] = [];
    let currentRowWidth = 0;
    let rowIndex = 0;

    for (let i = 0; i < tags.length; i++) {
      const tagWidth = tagWidths[i] || 100;
      const rowMaxWidth = getRowMaxWidthPx(rowIndex);

      if (currentTags.length > 0 && currentRowWidth + tagWidth > rowMaxWidth) {
        // Finish current row
        rows.push({
          tags: currentTags,
          maxWidthPct: (getRowMaxWidthPx(rows.length) / containerWidth) * 100,
        });
        currentTags = [];
        currentRowWidth = 0;
        rowIndex++;
      }

      currentTags.push(tags[i]);
      currentRowWidth += tagWidth;
    }

    if (currentTags.length > 0) {
      rows.push({
        tags: currentTags,
        maxWidthPct: (getRowMaxWidthPx(rows.length) / containerWidth) * 100,
      });
    }

    setLayoutRows(rows);
  }, [tags, desktop]);

  // Run layout computation after render (when measureRef is available)
  useEffect(() => {
    if (desktop && !layoutRows) {
      computeLayout();
    }
  }, [desktop, layoutRows, computeLayout]);

  // Desktop: render with computed row layout
  if (desktop && layoutRows) {
    return (
      <div className={styles.chartBreakdownTags}>
        {layoutRows.map((row, i) => (
          <div
            key={i}
            className={styles.chartBreakdownTagRow}
            style={{ maxWidth: `${row.maxWidthPct}%` }}
          >
            {row.tags.map((tag) => (
              <div key={tag.key} className={styles.chartBreakdownTag}>
                {tag.node}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Mobile or measurement pass
  const isMeasurementPass = desktop && !layoutRows;
  return (
    <div
      ref={measureRef}
      className={styles.chartBreakdownTags}
      style={
        isMeasurementPass ? { visibility: "hidden", width: "100%" } : undefined
      }
    >
      {tags.map((tag) => (
        <div key={tag.key} className={styles.chartBreakdownTag}>
          {tag.node}
        </div>
      ))}
    </div>
  );
};
