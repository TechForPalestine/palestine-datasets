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

const childrenRatePct = Math.round(
  ((previewData.known_killed_in_gaza.female.child +
    previewData.known_killed_in_gaza.male.child) /
    previewData.known_killed_in_gaza.records) *
    100
);
const childrenStrokeOffset =
  ((100 - childrenRatePct / 2) / 100) * radialProgressCircum;

const womenRatePct = Math.round(
  (previewData.known_killed_in_gaza.female.adult /
    previewData.known_killed_in_gaza.records) *
    100
);
const womenStrokeOffset =
  ((100 - womenRatePct / 2) / 100) * radialProgressCircum;

const elderlyRatePct = Math.round(
  ((previewData.known_killed_in_gaza.female.senior +
    previewData.known_killed_in_gaza.male.senior) /
    previewData.known_killed_in_gaza.records) *
    100
);
const elderlyStrokeOffset =
  ((100 - elderlyRatePct / 2) / 100) * radialProgressCircum;

const numFmt = new Intl.NumberFormat();

const days = chartData.data.length;

let sliderCount: SVGTextElement;
let sliderLine: SVGPathElement;
let sliderDot: SVGCircleElement;
let sliderLabel: HTMLDivElement;

// align with media query in CSS
const isMobile = () => typeof window === "object" && window.innerWidth <= 500;

const elId = (id: string) => {
  if (isMobile()) {
    return `${id}Mobile`;
  }

  return id;
};

const resetElementHandles = () => {
  sliderCount = undefined;
  sliderLine = undefined;
  sliderDot = undefined;
  sliderLabel = undefined;
};

let setHandleResetListener = false;

const moveLine = (day: number) => {
  if (!sliderDot || !sliderLine) {
    sliderCount = document.querySelector(`#${elId("chartcount")}`);
    sliderLine = document.querySelector(`#${elId("chartsliderline")}`);
    sliderDot = document.querySelector(`#${elId("chartsliderdot")}`);
    // not in SVG, does not have to be scoped
    sliderLabel = document.querySelector("#chartsliderlabel");
  }

  if (!setHandleResetListener) {
    setHandleResetListener = true;
    window.addEventListener("resize", resetElementHandles);
  }

  sliderCount.innerHTML = numFmt.format(chartData.data[day].killed);
  const { dayPoints, height } = isMobile() ? chartData.mobile : chartData;

  const [x, y] = dayPoints[day];
  const lineData = `M${x} ${y} v${height - y}`;
  sliderLine.setAttribute("d", lineData);
  sliderDot.setAttribute("cx", x.toString());
  sliderDot.setAttribute("cy", `${y}`);

  const sliderProgress = (day + 1) / days;
  const parentSize = sliderLabel.parentElement.getBoundingClientRect().width;
  const labelSize = sliderLabel.getBoundingClientRect().width;
  const rightOffset = Math.round((1 - sliderProgress) * parentSize);
  if (labelSize + rightOffset < parentSize) {
    sliderLabel.style.left = "auto";
    sliderLabel.style.right = `${rightOffset}px`;
  } else {
    sliderLabel.style.left = "0px";
    sliderLabel.style.right = "auto";
  }
};

const sliderLabels = chartData.data.map(
  (dayData, i) => `${format(parseISO(dayData.date), "MMMM do")} (Day ${i + 1})`
);

export const HomeDailyChart = () => {
  const tracked = useRef(false);
  const [day, setDay] = useState(days - 1);
  const dayData = chartData.data[day];

  const onSliderChange = (e) => {
    if (!tracked.current) {
      tracked.current = true;
    }

    const { value } = e.target;
    setDay(+value);
    moveLine(+value);
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartTitle}>
        The Human Toll <span>Daily Casualties Datasets</span>
      </div>
      <div className={styles.chartSubtitle}>
        Since October 7, 2023 for Gaza and the West Bank
      </div>
      <div className={styles.chartWarning}>
        <a href="/updates/gaza-ministry-casualty-context/">
          <svg
            width="17"
            height="15"
            viewBox="0 0 88 76"
            fill="none"
            style={{ position: "relative", top: 2 }}
          >
            <path
              d="M0 76H88L44 0L0 76ZM48 64H40V56H48V64ZM48 48H40V32H48V48Z"
              fill="var(--tfp-chart-warning)"
            />
          </svg>{" "}
          Learn why these numbers do not fully reflect the human toll
        </a>
      </div>
      <div className={styles.chartBreakdownTags}>
        <div className={styles.chartBreakdownTagsTopRow}>
          <div className={styles.chartBreakdownTag}>
            {numFmt.format(dayData.injured)} <span>injured</span>
          </div>
          {!!dayData.children && (
            <div className={styles.chartBreakdownTag}>
              {numFmt.format(dayData.children)} children <span>killed</span>
            </div>
          )}
          {!!dayData.women && (
            <div className={styles.chartBreakdownTag}>
              {numFmt.format(dayData.women)} women <span>killed</span>
            </div>
          )}
          {!!dayData.seekingAid && (
            <div className={styles.chartBreakdownTag}>
              {numFmt.format(dayData.seekingAid)} <span>killed</span> or{" "}
              <span>injured</span> seeking aid
            </div>
          )}
        </div>
        <div className={styles.chartBreakdownTagsSubsequentRows}>
          {!!dayData.starved && (
            <div className={styles.chartBreakdownTag}>
              {numFmt.format(dayData.starved)} <span>starved</span>
            </div>
          )}
          <div className={styles.chartBreakdownTag}>
            {numFmt.format(dayData.medical)} medical personnel{" "}
            <span>killed</span>
          </div>
          <div className={styles.chartBreakdownTag}>
            {numFmt.format(dayData.press)}{" "}
            {dayData.press === 1 ? "journalist" : "journalists"}{" "}
            <span>killed</span>
          </div>
          {!!dayData.civdef && (
            <div className={styles.chartBreakdownTag}>
              {numFmt.format(dayData.civdef)} first responders{" "}
              <span>killed</span>
            </div>
          )}
          <br />
          {!!dayData.settlerActs && (
            <div className={styles.chartBreakdownTag}>
              {numFmt.format(dayData.settlerActs)} settler <span>attacks</span>
            </div>
          )}
        </div>
      </div>
      <div className={styles.homeChartDesktop}>
        <HomepageCasualtyChart style={{ width: "100%", height: "auto" }} />
      </div>
      <div className={styles.homeChartMobile}>
        <HomepageCasualtyChartMobile
          style={{ width: "100%", height: "auto" }}
        />
      </div>
      <div className={styles.chartSlider}>
        <div style={{ position: "relative", height: 30 }}>
          <div id="chartsliderlabel" className={styles.chartSliderLabel}>
            {sliderLabels[day]}
          </div>
        </div>

        <input
          type="range"
          onChange={onSliderChange}
          min={0}
          max={days - 1}
          step={1}
          value={day}
          list="days"
        />
        <div className={styles.chartSliderHint}>
          Use the slider to change the date
        </div>
      </div>
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
          color: "var(--ifm-color-primary)",
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
    </div>
  );
};
