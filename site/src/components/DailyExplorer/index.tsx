import clsx from "clsx";
import React, { useRef, useState } from "react";
import DailyChart from "@site/src/generated/daily-chart";
import chartData from "@site/src/generated/daily-chart.json";
import styles from "./styles.module.css";

const days = chartData.data.length;
const sliderStepSize = 10;
const roundedStepDays = Math.floor(days / sliderStepSize);
const sliderSteps = Array.from(new Array(roundedStepDays)).map(
  (_, index) => index * sliderStepSize
);

const MemoizedChart = React.memo(() => {
  return <DailyChart />;
});

const num = new Intl.NumberFormat();

export const DailyExplorer = () => {
  const [day, setDay] = useState(days - 1);
  const dayData = chartData.data[day];

  const onSliderChange = (e) => {
    const { value } = e.target;
    setDay(+value);
    const svgMask = document.querySelector("#svgmask");
    if (svgMask) {
      const progress = (+value + 1) / days;
      const width = Math.round(chartData.width * progress);
      svgMask.setAttribute("width", `${width}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className="row">
        <div className={clsx("col col--6")}>
          <div>Day {day + 1}</div>
          <input
            type="range"
            onChange={onSliderChange}
            min={0}
            max={days - 1}
            step={1}
            value={day}
            list="days"
          />
          <datalist id="days">
            {sliderSteps.map((step) => (
              <option value={step} label={`${step}`}></option>
            ))}
          </datalist>
          <ul>
            <li>{dayData.date}</li>
            <li>{num.format(dayData.injured)} injured</li>
            <li>{num.format(dayData.children)} children killed</li>
            <li>{num.format(dayData.women)} women killed</li>
            <li>{num.format(dayData.medical)} medical personnel killed</li>
            <li>{num.format(dayData.press)} journalists killed</li>
            <li>{num.format(dayData.civdef)} emergency personnel killed</li>
          </ul>
        </div>
        <div className={[clsx("col col--6"), styles.chartColumn].join(" ")}>
          <div />
          <div className={styles.chartLabel}>
            {num.format(dayData.killed)} killed
          </div>
          <MemoizedChart />
        </div>
      </div>
    </div>
  );
};
