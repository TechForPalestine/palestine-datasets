import { useState } from "react";
import { parseISO } from "date-fns/parseISO";
import { format } from "date-fns/format";
import HomepageCasualtyChart from "../../generated/daily-chart";
import chartData from "../../generated/daily-chart.json";
import styles from "./HomeDailyChart.styles.module.css";
import { Button } from "../Button";

const numFmt = new Intl.NumberFormat();

const days = chartData.data.length;

let sliderCount: SVGTextElement;
let sliderLine: SVGPathElement;
let sliderDot: SVGCircleElement;
let sliderLabel: HTMLDivElement;

const moveLine = (day: number) => {
  if (!sliderDot || !sliderLine) {
    sliderCount = document.querySelector("#chartcount");
    sliderLine = document.querySelector("#chartsliderline");
    sliderDot = document.querySelector("#chartsliderdot");
    sliderLabel = document.querySelector("#chartsliderlabel");
  }

  sliderCount.innerHTML = numFmt.format(chartData.data[day].killed);

  const [x, y] = chartData.dayPoints[day];
  const lineData = `M${x} ${y} v${chartData.height - y}`;
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

const radialProgressWidth = 250;
const radialProgressHeight = radialProgressWidth / 2;
const radialProgressRadius = radialProgressWidth * (80 / 200);
const radialProgressCircum = Math.PI * (radialProgressRadius * 2);

const HalfRadialProgress = ({ rate, label, strokeOffset }) => {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        textAlign: "center",
      }}
    >
      <div
        style={{
          transform: "scale(-1,-1)",
          position: "relative",
          display: "inline-block",
        }}
      >
        <svg
          width={radialProgressWidth}
          height={radialProgressHeight}
          viewBox={`0 0 ${radialProgressWidth} ${radialProgressHeight}`}
        >
          <circle
            cx={radialProgressWidth / 2}
            cy={radialProgressHeight}
            r={radialProgressRadius}
            stroke="#eee"
            strokeWidth="15"
            transform={`translate(0,-${radialProgressHeight})`}
            fill="none"
          />
          <circle
            cx={radialProgressWidth / 2}
            cy={radialProgressHeight}
            r={radialProgressRadius}
            stroke="#29784c"
            strokeWidth="15"
            strokeLinecap="round"
            strokeDasharray={radialProgressCircum}
            strokeDashoffset={strokeOffset}
            transform={`translate(0,-${radialProgressHeight})`}
            fill="none"
          />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          top: "40%",
          textAlign: "center",
          width: "100%",
          fontSize: "2em",
          fontWeight: "bold",
          color: "#29784c",
        }}
      >
        {rate ? `${rate}%` : "-"}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "5px",
          textAlign: "center",
          width: "100%",
          fontSize: "1em",
          fontWeight: "bold",
          color: "#29784c",
        }}
      >
        <span>{label}</span>
      </div>
    </div>
  );
};

export const HomeDailyChart = () => {
  const [day, setDay] = useState(days - 1);
  const dayData = chartData.data[day];

  const onSliderChange = (e) => {
    const { value } = e.target;
    setDay(+value);
    moveLine(+value);
  };

  const childrenRatePct = Math.round((dayData.children / dayData.killed) * 100);
  const childrenStrokeOffset =
    ((100 - childrenRatePct / 2) / 100) * radialProgressCircum;

  const womenRatePct = Math.round((dayData.women / dayData.killed) * 100);
  const womenStrokeOffset =
    ((100 - womenRatePct / 2) / 100) * radialProgressCircum;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartTitle}>
        The Human Toll{" "}
        <span>&nbsp;&nbsp;|&nbsp;&nbsp;Daily Casualties Dataset</span>
      </div>
      <div className={styles.chartSubtitle}>Since October 7, 2023</div>
      <div className={styles.chartBreakdownTags}>
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
        <div className={styles.chartBreakdownTag}>
          {numFmt.format(dayData.medical)} medical personnel <span>killed</span>
        </div>
        <div className={styles.chartBreakdownTag}>
          {numFmt.format(dayData.press)}{" "}
          {dayData.press === 1 ? "journalist" : "journalists"}{" "}
          <span>killed</span>
        </div>
        {!!dayData.civdef && (
          <div className={styles.chartBreakdownTag}>
            {numFmt.format(dayData.civdef)} emergency personnel{" "}
            <span>killed</span>
          </div>
        )}
      </div>
      <HomepageCasualtyChart />
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
      </div>
      <div
        style={{
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
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
          </div>
        </div>
        <div className={styles.chartFooterCopy}>
          <p>Use the slider above to explore the human impact over time.</p>
          <p>
            These counts do not account for those still lost in the rubble of
            destroyed buildings: estimated to be more than seven thousand.
          </p>
        </div>
      </div>
      <div
        style={{
          backgroundColor: "#eee",
          fontSize: "1.5em",
          fontWeight: "bold",
          textAlign: "center",
          color: "#33925d",
          paddingTop: "30px",
        }}
      >
        Start telling their story
      </div>
      <div
        style={{
          backgroundColor: "#eee",
          display: "flex",
          justifyContent: "center",
          padding: "20px",
          paddingBottom: "40px",
          borderBottomLeftRadius: "6px",
          borderBottomRightRadius: "6px",
        }}
      >
        <Button to="/docs/casualties-daily" type="secondary">
          Learn more about this dataset
        </Button>
        <div style={{ width: 10 }} />
        <Button to="/docs/casualties-daily" type="primary">
          Download CSV
        </Button>
      </div>
      <div style={{ margin: "100px auto", textAlign: "center" }}>
        <hr />
        <p>This is a draft for feedback (desktop only).</p>
        <p>
          Please focus feedback on the content above using desktop viewports
          (not ready for review on mobile).
        </p>
        <hr />
      </div>
    </div>
  );
};
