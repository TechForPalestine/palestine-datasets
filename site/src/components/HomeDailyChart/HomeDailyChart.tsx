import { useRef, useState } from "react";
import { parseISO } from "date-fns/parseISO";
import { format } from "date-fns/format";
import HomepageCasualtyChart from "../../generated/daily-chart";
import HomepageCasualtyChartMobile from "../../generated/daily-chart-mobile";
import chartData from "../../generated/daily-chart.json";
import styles from "./HomeDailyChart.styles.module.css";
import { Button } from "../Button";
import { HalfRadialProgress, radialProgressCircum } from "./HalfRadialProgress";
import previewData from "@site/src/generated/summary.json";
import { BuildFlags } from "@site/src/lib/build-flags";

const childrenRatePct = Math.round(
  ((previewData.known_killed_in_gaza.female.child + previewData.known_killed_in_gaza.male.child) /
    previewData.known_killed_in_gaza.records) *
    100,
);
const childrenStrokeOffset = ((100 - childrenRatePct / 2) / 100) * radialProgressCircum;

const womenRatePct = Math.round(
  (previewData.known_killed_in_gaza.female.adult / previewData.known_killed_in_gaza.records) * 100,
);
const womenStrokeOffset = ((100 - womenRatePct / 2) / 100) * radialProgressCircum;

const elderlyRatePct = Math.round(
  ((previewData.known_killed_in_gaza.female.senior + previewData.known_killed_in_gaza.male.senior) /
    previewData.known_killed_in_gaza.records) *
    100,
);
const elderlyStrokeOffset = ((100 - elderlyRatePct / 2) / 100) * radialProgressCircum;

const numFmt = new Intl.NumberFormat();
// "—" for zero/missing values so every rail row always renders at the same
// height, regardless of which day is selected.
const railValue = (n: number) => (n ? numFmt.format(n) : "—");

const days = chartData.data.length;

let markerLine: SVGPathElement;
let markerDot: SVGCircleElement;

// align with media query in CSS
const isMobile = () => typeof window === "object" && window.innerWidth <= 500;

const elId = (id: string) => {
  if (isMobile()) {
    return `${id}Mobile`;
  }

  return id;
};

const resetElementHandles = () => {
  markerLine = undefined;
  markerDot = undefined;
};

let setHandleResetListener = false;

const moveMarker = (day: number) => {
  if (!markerLine || !markerDot) {
    markerLine = document.querySelector(`#${elId("chartmarkerline")}`);
    markerDot = document.querySelector(`#${elId("chartmarkerdot")}`);
  }

  if (!setHandleResetListener) {
    setHandleResetListener = true;
    window.addEventListener("resize", resetElementHandles);
  }

  const { dayPoints, height } = isMobile() ? chartData.mobile : chartData;
  const [x, y] = dayPoints[day];
  markerLine.setAttribute("d", `M${x} ${y} v${height - y}`);
  markerDot.setAttribute("cx", x.toString());
  markerDot.setAttribute("cy", `${y}`);
};

const dayFromPointerX = (clientX: number, rect: DOMRect) => {
  const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return Math.round(fraction * (days - 1));
};

export const HomeDailyChart = () => {
  const dayRef = useRef(days - 1);
  const [day, setDay] = useState(days - 1);
  const dayData = chartData.data[day];

  const onScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nextDay = dayFromPointerX(e.clientX, rect);
    if (nextDay !== dayRef.current) {
      dayRef.current = nextDay;
      setDay(nextDay);
      moveMarker(nextDay);
    }
  };

  const dateLabel = format(parseISO(dayData.date), "MMMM do, yyyy");
  const [markX, markY] = chartData.dayPoints[day];
  const calloutPct = (markX / chartData.width) * 100;
  const calloutAnchor =
    calloutPct > 74
      ? { right: 0 }
      : calloutPct < 4
        ? { left: 0 }
        : { left: `${calloutPct - 4}%` };
  const calloutAbove = markY > chartData.height * 0.4;

  const railRows = [
    { label: "Injured", value: railValue(dayData.injured) },
    { label: "Children killed", value: railValue(dayData.children) },
    { label: "Women killed", value: railValue(dayData.women) },
    { label: "Medical personnel killed", value: railValue(dayData.medical) },
    {
      label: dayData.press === 1 ? "Journalist killed" : "Journalists killed",
      value: railValue(dayData.press),
    },
    { label: "First responders killed", value: railValue(dayData.civdef) },
  ];

  const warningLink = (
    <a href="/updates/gaza-ministry-casualty-context/" className={styles.railFootnote}>
      <svg width="17" height="15" viewBox="0 0 88 76" fill="none" className={styles.railFootnoteIcon}>
        <path
          d="M0 76H88L44 0L0 76ZM48 64H40V56H48V64ZM48 48H40V32H48V48Z"
          fill="var(--tfp-chart-warning)"
        />
      </svg>
      <span>Why these numbers do not fully reflect the human toll</span>
    </a>
  );

  return (
    <div className={styles.chartContainer}>
      <span className={styles.eyebrow}>Daily Casualties Datasets</span>
      <div className={styles.mastRow}>
        <h2 className={styles.chartTitle}>The Human Toll</h2>
        <span className={styles.mastLine} aria-hidden="true" />
      </div>
      <div className={styles.chartSubtitle}>Since October 7, 2023 for Gaza and the West Bank</div>

      <div className={styles.chartGrid}>
        <div className={styles.rail}>
          <div className={styles.railDayLabel}>{dateLabel}</div>
          <div className={styles.railCount}>{numFmt.format(dayData.killed)}</div>
          <div className={styles.railCaption}>killed in Gaza and the West Bank</div>
          <div className={styles.railDivider} aria-hidden="true" />
          <div>
            {railRows.map((row) => (
              <div key={row.label} className={styles.railRow}>
                <span className={styles.railRowLabel}>{row.label}</span>
                <b className={styles.railRowValue}>{row.value}</b>
              </div>
            ))}
          </div>
          {warningLink}
        </div>

        <div className={styles.chartColumn}>
          <div className={styles.homeChartDesktop}>
            <div
              className={styles.chartScrubArea}
              onPointerMove={onScrub}
              style={{ touchAction: "pan-y" }}
            >
              <HomepageCasualtyChart style={{ width: "100%", height: "auto" }} />
              <div
                className={styles.chartCallout}
                style={{
                  ...calloutAnchor,
                  top: calloutAbove
                    ? `${((markY - 76) / chartData.height) * 100}%`
                    : `${((markY + 22) / chartData.height) * 100}%`,
                }}
              >
                <div className={styles.chartCalloutDay}>
                  Day {day + 1} &middot; {dateLabel}
                </div>
                <div className={styles.chartCalloutStat}>
                  {numFmt.format(dayData.killed)} killed &middot; {numFmt.format(dayData.injured)}{" "}
                  injured
                </div>
              </div>
            </div>
          </div>
          <div className={styles.homeChartMobile}>
            <div
              className={styles.chartScrubArea}
              onPointerMove={onScrub}
              style={{ touchAction: "pan-y" }}
            >
              <HomepageCasualtyChartMobile style={{ width: "100%", height: "auto" }} />
              <div className={styles.chartCalloutMobile}>
                <div className={styles.chartCalloutDay}>
                  Day {day + 1} &middot; {dateLabel}
                </div>
                <div className={styles.chartCalloutStat}>
                  {numFmt.format(dayData.killed)} killed &middot; {numFmt.format(dayData.injured)}{" "}
                  injured
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.chartFooterButtonsContainer}>
        <div className={styles.chartFooterButtons}>
          <Button to="/docs/datasets?chartdata=1" type="secondary">
            Learn more about this dataset
          </Button>
        </div>
      </div>
      {BuildFlags.legacyModules && (
        <>
          <div className={styles.chartRadialsContainer}>
            <div className={styles.chartRadials}>
              <div>Of those killed:</div>
              <div>
                <HalfRadialProgress
                  {...{
                    rate: childrenRatePct,
                    strokeOffset: childrenStrokeOffset,
                    label: "were children",
                  }}
                />
                <HalfRadialProgress
                  {...{
                    rate: womenRatePct,
                    strokeOffset: womenStrokeOffset,
                    label: "were women",
                  }}
                />
                {!isMobile() && (
                  <HalfRadialProgress
                    {...{
                      rate: elderlyRatePct,
                      strokeOffset: elderlyStrokeOffset,
                      label: "were elderly",
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <div
            style={{
              backgroundColor: "var(--tfp-chart-cta-box-fill)",
              fontSize: "1.5em",
              fontWeight: "bold",
              textAlign: "center",
              color: "var(--tfp-radial-section-title)",
              paddingTop: "30px",
            }}
          >
            Start telling their story:
          </div>
          <div className={styles.chartFooterButtonsContainer}>
            <div className={styles.chartFooterButtons}>
              <Button to="/docs/datasets?chartdata=1" type="primary">
                Get the daily numbers
              </Button>
              <div style={{ width: 10, height: 10 }} />
              <Button to="/docs/killed-in-gaza" type="primary">
                Get the list of those killed
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
