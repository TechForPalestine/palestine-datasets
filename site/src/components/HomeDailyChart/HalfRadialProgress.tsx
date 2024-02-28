import styles from "./HomeDailyChart.styles.module.css";

const radialProgressWidth = 250;
const radialProgressHeight = radialProgressWidth / 2;
const radialProgressRadius = radialProgressWidth * (80 / 200);
export const radialProgressCircum = Math.PI * (radialProgressRadius * 2);

export const HalfRadialProgress = ({ rate, label, strokeOffset }) => {
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
            stroke="var(--tfp-radial-progress-track)"
            strokeWidth="15"
            transform={`translate(0,-${radialProgressHeight})`}
            fill="none"
          />
          <circle
            cx={radialProgressWidth / 2}
            cy={radialProgressHeight}
            r={radialProgressRadius}
            stroke="var(--tfp-radial-progress-fill)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeDasharray={radialProgressCircum}
            strokeDashoffset={strokeOffset}
            transform={`translate(0,-${radialProgressHeight})`}
            fill="none"
          />
        </svg>
      </div>
      <div className={styles.chartRadialRateText}>
        {rate ? `${rate}%` : "-"}
      </div>
      <div className={styles.chartRadialRateLabel}>
        <span>{label}</span>
      </div>
    </div>
  );
};
