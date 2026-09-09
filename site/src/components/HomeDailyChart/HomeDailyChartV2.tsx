import { useRef, useState } from "react";
import clsx from "clsx";
import { parseISO } from "date-fns/parseISO";
import { format } from "date-fns/format";
import HomepageCasualtyChartV2 from "../../generated/daily-chart-v2";
import HomepageCasualtyChartV2Mobile from "../../generated/daily-chart-v2-mobile";
import chartData from "../../generated/daily-chart-v2.json";
import styles from "./HomeDailyChartV2.styles.module.css";
import { Button } from "../Button";

const numFmt = new Intl.NumberFormat();
// "—" for zero/missing values so every rail row always renders at the same
// height, regardless of which day is selected.
const railValue = (n: number) => (n ? numFmt.format(n) : "—");

const days = chartData.data.length;
const lastDay = days - 1;

// Key dated events baked in by the generator, with their marker positions in
// svg coordinates (null where the marker was thinned out to avoid a clump).
const events = chartData.events;
const eventByDay = new Map(events.map((event) => [event.day, event]));

// A single day is well under a pixel wide, so scrubbing would almost never
// land exactly on an event. Snapping a few days either side makes the marked
// dates reachable by pointer while leaving the rest of the chart scrubbable.
const snapDays = 3;
const snapToEvent = (day: number) => {
  let closest = day;
  let closestDistance = snapDays;
  events.forEach((event) => {
    const distance = Math.abs(event.day - day);
    if (distance <= closestDistance) {
      closestDistance = distance;
      closest = event.day;
    }
  });
  return closest;
};

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

const eventDateLabel = (date: string) => format(parseISO(date), "MMMM d, yyyy");

/**
 * Dots on the line marking the key events, overlaid on the baked svg. They
 * sit at a percentage of the chart box so they track the svg as it scales,
 * and are real buttons so the dates are reachable by keyboard and by tap.
 */
const EventMarkers = ({
  points,
  width,
  height,
  activeDay,
  onSelect,
  onDismiss,
}: {
  points: (number[] | null)[];
  width: number;
  height: number;
  activeDay: number | null;
  onSelect: (day: number) => void;
  onDismiss: () => void;
}) => (
  <>
    {events.map((event, index) => {
      const point = points[index];
      if (!point) {
        return null;
      }
      const [x, y] = point;
      return (
        <button
          key={event.date}
          type="button"
          className={clsx(styles.eventMarker, activeDay === event.day && styles.eventMarkerActive)}
          style={{ left: `${(x / width) * 100}%`, top: `${(y / height) * 100}%` }}
          aria-label={`${eventDateLabel(event.date)}: ${event.title}`}
          onClick={() => onSelect(event.day)}
          onFocus={() => onSelect(event.day)}
          onBlur={onDismiss}
        >
          <span className={styles.eventMarkerDot} aria-hidden="true" />
        </button>
      );
    })}
  </>
);

export const HomeDailyChartV2 = () => {
  // null while the visitor isn't scrubbing: the rail falls back to the latest
  // day and the callout stays hidden rather than lingering over the chart.
  const [activeDay, setActiveDay] = useState<number | null>(null);
  // A marker that was tapped or focused keeps its callout up after the
  // pointer leaves, so the event text can actually be read on touch.
  const [pinned, setPinned] = useState(false);
  const dayRef = useRef<number | null>(null);

  const day = activeDay ?? lastDay;
  const dayData = chartData.data[day];
  const activeEvent = activeDay === null ? undefined : eventByDay.get(activeDay);

  const setDay = (nextDay: number) => {
    if (nextDay === dayRef.current) {
      return;
    }
    dayRef.current = nextDay;
    setActiveDay(nextDay);
    moveMarker(nextDay);
  };

  const onScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPinned(false);
    setDay(snapToEvent(dayFromPointerX(e.clientX, rect)));
  };

  // Back to rest: no callout, and the rail and marker return to the latest day.
  const clearDay = () => {
    dayRef.current = null;
    setActiveDay(null);
    moveMarker(lastDay);
  };

  const onLeave = () => {
    if (pinned) {
      return;
    }
    clearDay();
  };

  const onSelectEvent = (eventDay: number) => {
    setDay(eventDay);
    setPinned(true);
  };

  const onDismissEvent = () => {
    setPinned(false);
    clearDay();
  };

  const dateLabel = format(parseISO(dayData.date), "MMMM do, yyyy");
  const [markX, markY] = chartData.dayPoints[day];
  const calloutPct = (markX / chartData.width) * 100;
  const calloutAnchor =
    calloutPct > 74 ? { right: 0 } : calloutPct < 4 ? { left: 0 } : { left: `${calloutPct - 4}%` };
  const calloutAbove = markY > chartData.height * 0.4;
  // Anchored by the edge nearest the marker so the callout can grow downward
  // (or upward) as event text is added without covering the point it marks.
  const calloutPosition = calloutAbove
    ? { bottom: `${(1 - (markY - 20) / chartData.height) * 100}%` }
    : { top: `${((markY + 22) / chartData.height) * 100}%` };

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

  const calloutBody = (
    <>
      <div className={styles.chartCalloutDay}>
        Day {day + 1} &middot; {dateLabel}
      </div>
      {activeEvent && <div className={styles.chartCalloutEvent}>{activeEvent.title}</div>}
      <div className={styles.chartCalloutStat}>
        {numFmt.format(dayData.killed)} killed &middot; {numFmt.format(dayData.injured)} injured
      </div>
      {activeEvent && <div className={styles.chartCalloutDetail}>{activeEvent.detail}</div>}
    </>
  );

  const chartHint = (
    <div className={styles.chartHint}>
      <span className={styles.chartHintDot} aria-hidden="true" />
      <span>Key events — hover or drag across the chart for any day&apos;s numbers</span>
    </div>
  );

  const warningLink = (
    <a href="/updates/gaza-ministry-casualty-context/" className={styles.railFootnote}>
      <svg
        width="17"
        height="15"
        viewBox="0 0 88 76"
        fill="none"
        className={styles.railFootnoteIcon}
      >
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
              onPointerDown={onScrub}
              onPointerMove={onScrub}
              onPointerLeave={onLeave}
              onPointerCancel={onLeave}
              style={{ touchAction: "pan-y" }}
            >
              <HomepageCasualtyChartV2 style={{ width: "100%", height: "auto" }} />
              <EventMarkers
                points={chartData.eventPoints}
                width={chartData.width}
                height={chartData.height}
                activeDay={activeDay}
                onSelect={onSelectEvent}
                onDismiss={onDismissEvent}
              />
              <div
                className={clsx(styles.chartCallout, activeDay === null && styles.chartCalloutIdle)}
                style={{ ...calloutAnchor, ...calloutPosition }}
              >
                {calloutBody}
              </div>
            </div>
          </div>
          <div className={styles.homeChartMobile}>
            <div
              className={styles.chartScrubArea}
              onPointerDown={onScrub}
              onPointerMove={onScrub}
              onPointerLeave={onLeave}
              onPointerCancel={onLeave}
              style={{ touchAction: "pan-y" }}
            >
              <HomepageCasualtyChartV2Mobile style={{ width: "100%", height: "auto" }} />
              <EventMarkers
                points={chartData.mobile.eventPoints}
                width={chartData.mobile.width}
                height={chartData.mobile.height}
                activeDay={activeDay}
                onSelect={onSelectEvent}
                onDismiss={onDismissEvent}
              />
              <div
                className={clsx(
                  styles.chartCalloutMobile,
                  activeDay === null && styles.chartCalloutIdle,
                )}
              >
                {calloutBody}
              </div>
            </div>
          </div>
          {chartHint}
        </div>
      </div>

      <div className={styles.chartFooterButtonsContainer}>
        <div className={styles.chartFooterButtons}>
          <Button to="/docs/datasets?chartdata=1" type="secondary">
            Learn more about this dataset
          </Button>
        </div>
      </div>
    </div>
  );
};
