import fs from "fs";
import D3Node from "d3-node";
import { transform } from "@svgr/core";
import pointAtLen from "point-at-length";
import chartEvents from "./chart_events.json";
import gazaDailyTimeSeries from "../../../../../casualties_daily.min.json";
import westBankDailyTimeSeries from "../../../../../west_bank_daily.min.json";
import { CasualtyDailyReportV2 } from "../../../../../types/casualties-daily.types";
import { bindHelpers } from "./svg-helpers";

type SlimData = {
  date: CasualtyDailyReportV2["report_date"];
  injured: CasualtyDailyReportV2["ext_injured_cum"];
  civdef: CasualtyDailyReportV2["ext_civdef_killed_cum"];
  children: CasualtyDailyReportV2["ext_killed_children_cum"];
  women: CasualtyDailyReportV2["ext_killed_women_cum"];
  killed: CasualtyDailyReportV2["ext_killed_cum"];
  medical: CasualtyDailyReportV2["ext_med_killed_cum"];
  press: CasualtyDailyReportV2["ext_press_killed_cum"];
  settlerActs: number;
};

type MappedData = {
  chart: Array<{ date: Date; value: number }>;
  slimData: SlimData[];
};

const eventsToSkipOnMobile = [
  "ICJ Ruling",
  "Thanksgiving",
  "NYE",
  "Superbowl",
  "Easter",
  "Ramadan",
];

const lastWestBankReport =
  westBankDailyTimeSeries[westBankDailyTimeSeries.length - 1];
const westBankLookup = westBankDailyTimeSeries.reduce(
  (acc, report) => ({
    ...acc,
    [report.report_date]: report,
  }),
  {} as Record<string, typeof lastWestBankReport>
);

const getWestBankValue = (
  reportDate: string,
  initialKey: [
    keyof typeof lastWestBankReport,
    keyof (typeof lastWestBankReport)["verified"] | undefined
  ],
  fallbackKey?: keyof typeof lastWestBankReport
) => {
  const report = westBankLookup[reportDate] ?? lastWestBankReport;
  const [key, subKey] = initialKey;
  let value = report[key];
  if (value && subKey) {
    value = value[subKey];
  }
  if (typeof value !== "number") {
    value = report[fallbackKey];
  }
  return typeof value === "number" ? value : 0;
};

let lastChildrenKilledReportPct = 0;
let lastWomenKilledReportPct = 0;
const data = gazaDailyTimeSeries.reduce(
  (
    acc,
    {
      report_date,
      ext_civdef_killed_cum,
      ext_injured_cum,
      killed_children_cum,
      ext_killed_children_cum,
      ext_killed_cum,
      killed_women_cum,
      ext_killed_women_cum,
      ext_med_killed_cum,
      ext_press_killed_cum,
    },
    day: number
  ) => {
    let children =
      ext_killed_children_cum +
      getWestBankValue(
        report_date,
        ["verified", "killed_children_cum"],
        "killed_children_cum"
      );
    let women = ext_killed_women_cum;

    let killed =
      ext_killed_cum +
      getWestBankValue(report_date, ["verified", "killed_cum"], "killed_cum");

    if (killed_children_cum) {
      lastChildrenKilledReportPct =
        (killed_children_cum +
          getWestBankValue(
            report_date,
            ["verified", "killed_children_cum"],
            "killed_children_cum"
          )) /
        killed;
    }

    if (killed_women_cum) {
      lastWomenKilledReportPct = killed_women_cum / killed;
    }

    if (lastChildrenKilledReportPct > 0) {
      children = Math.floor(killed * lastChildrenKilledReportPct);
    }
    if (lastWomenKilledReportPct > 0) {
      women = Math.floor(killed * lastWomenKilledReportPct);
    }

    return {
      ...acc,
      // just keep what we plan to surface in our UI
      slimData: acc.slimData.concat({
        date: report_date,
        civdef: ext_civdef_killed_cum,
        injured:
          ext_injured_cum +
          getWestBankValue(
            report_date,
            ["verified", "injured_cum"],
            "injured_cum"
          ),
        children,
        killed,
        women,
        medical: ext_med_killed_cum,
        press: ext_press_killed_cum,
        settlerActs: westBankLookup[report_date].settler_attacks_cum,
      }),
      chart: acc.chart.concat({
        date: D3Node.d3.timeParse("%Y-%m-%d")(report_date),
        value:
          ext_killed_cum +
          getWestBankValue(
            report_date,
            ["verified", "killed_cum"],
            "killed_cum"
          ),
      }),
    };
  },
  {
    chart: [],
    slimData: [],
  } as MappedData
);

const json: {
  data: typeof data.slimData;
  width: number;
  height: number;
  dayPoints: [number, number][];
  eventDotRadius: number;
  mobile: {
    width: number;
    height: number;
    dayPoints: [number, number][];
    eventDotRadius: number;
  };
} = {
  data: data.slimData,
  width: 0,
  height: 0,
  dayPoints: [],
  eventDotRadius: 0,
  mobile: {
    width: 0,
    height: 0,
    dayPoints: [],
    eventDotRadius: 0,
  },
};

const eventDotRadius = 9;

// the chart line path is a "filled area" and we only want the stroke (chart line)
// to appear for the top side of the filled gradient area, so we need to use a combo
// of dasharray and dashoffset to achieve this for the two graph sizes we generate.
// note: this has an effect on the coordinates we get for event dots, etc.
const mobileLinePathLen = 660;
const mobileLineStartOffset = 38;
const desktopLinePathLen = 1080;
const desktopLineStartOffset = 0;

const render = async ({ mobile } = { mobile: false }) => {
  const width = mobile ? 500 : 1000;
  const height = 300;
  const id = (elementId: string) => `${elementId}${mobile ? "Mobile" : ""}`;

  const d3n = new D3Node();
  const { d3 } = d3n;

  const svg = d3n
    .createSVG(width, height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("overflow", "visible");

  const helpers = bindHelpers(svg, id, {
    eventDotRadius,
    width,
    height,
    mobile,
  });

  // bottom axis line
  svg
    .append("path")
    .attr("d", `M0 ${height} h${width}`)
    .attr("stroke", "var(--tfp-chart-axis-line)")
    .attr("stroke-width", "4");

  var x = d3
    .scaleTime()
    .domain(
      d3.extent(data.chart, function (d: any) {
        return d.date;
      })
    )
    .range([0, width]);

  var y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data.chart, function (d: any) {
        return +d.value;
      }),
    ])
    .range([height, 0]);

  const pathData = d3
    .area()
    .x(function (d: any) {
      return x(d.date);
    })
    .y0(y(0))
    .y1(function (d: any) {
      return y(d.value);
    });

  const days = data.slimData.length;

  const linePathId = "chartlinepath";

  const path = svg
    .append("path")
    .datum(data.chart)
    .attr("id", id(linePathId))
    .attr("fill", `url(#${id("pathFillGradient")})`)
    .attr("stroke", "var(--ifm-color-primary-darker)")
    .attr("stroke-width", 3)
    .attr(
      "stroke-dashoffset",
      mobile ? mobileLineStartOffset : desktopLineStartOffset
    )
    .attr(
      "stroke-dasharray",
      mobile ? `${mobileLinePathLen},850` : `${desktopLinePathLen},1305`
    )
    .attr("stroke-linecap", "round")
    .attr("d", pathData);

  const desiredTickCount = mobile ? 5 : 10;
  const xAxisPlan = days / desiredTickCount;
  const xAxisStep = Math.ceil(xAxisPlan / 5) * 5;
  const xAxisSteps: number[] = [0];
  const maxStep = xAxisStep * days;
  while (xAxisSteps[xAxisSteps.length - 1] < days) {
    const nextStep = xAxisSteps[xAxisSteps.length - 1] + xAxisStep;
    if (nextStep < maxStep) {
      xAxisSteps.push(nextStep);
    }
  }
  xAxisSteps[0] = 1;

  const pathDataValue = path.attr("d");
  const pathPoints = pointAtLen(pathDataValue);
  const svgDomain = {
    maxPathLength: mobile ? mobileLinePathLen : desktopLinePathLen,
  };
  const daySegmentLength = svgDomain.maxPathLength / days;

  let lastPoint: [number, number] = [0, height];
  const topRightXThreshold = width * 0.98;
  const verticalDropThreshold = 4;
  const dayPoints = Array.from(new Array(days)).map((_, i) => {
    const coordinates = pathPoints.at((i + 1) * daySegmentLength);
    const [x, y] = coordinates;
    // for some reason on mobile the visual chart path ends before the
    // the "data path" does, so without this limiter, the movable dot
    // would appear to drop off the cliff at the end of the chart so we'll
    // hold it at the max even if that means the values change but the dot
    // stays in place (TODO: figure out why this isn't the case on desktop)
    if (x > topRightXThreshold && y > verticalDropThreshold) {
      return lastPoint;
    }
    lastPoint = coordinates;
    return coordinates;
  });

  const axisStepMinDistance = width * 0.1;
  const xAxisPoints = xAxisSteps.reduce((points, stepValue) => {
    const stepProgress = ((stepValue + 1) / days) * svgDomain.maxPathLength;
    const point = pathPoints.at(stepProgress);
    const lastPointX = points[points.length - 1]?.[0] ?? 0;
    // don't allow axis ticks too close together, particularly
    // near the right-side end where TODAY takes up more space
    if (point[0] < lastPointX + axisStepMinDistance) {
      return points;
    }
    return points.concat([point]);
  }, [] as [number, number][]);

  const dotOffset = eventDotRadius * 2;
  const eventLabelBottomOffset = 20;
  const eventLineLabelOffset = 25;

  chartEvents.forEach((chartEvent) => {
    if (mobile && eventsToSkipOnMobile.includes(chartEvent.label)) {
      return;
    }

    const eventIndex = data.slimData.findIndex(
      ({ date }) => date === chartEvent.date
    );
    const eventTimeProgress =
      ((eventIndex + 1) / days) * svgDomain.maxPathLength;
    const eventPoint = pathPoints.at(eventTimeProgress);
    helpers.addEventPoint({
      eventPoint,
      eventLabel: chartEvent.label,
      dotOffset,
      eventLineLabelOffset,
      eventLabelBottomOffset,
    });
  });

  helpers.addEventDotShadowFilter();

  // main count label
  const latestKilledValue = new Intl.NumberFormat().format(
    data.slimData[data.slimData.length - 1].killed
  );
  helpers.addKilledCountLabelOverlay(latestKilledValue);

  xAxisPoints.forEach((point, i) => {
    const lastTick = i === xAxisPoints.length - 1;
    const [x, y] = point;
    helpers.addAxisTickLabel({ i, x, xAxisSteps, lastTick });

    if (lastTick) {
      //
      // movable dot for "TODAY"
      //
      helpers.addMovableDotLine();
    }
  });

  helpers.addGradientDefinition();

  const svgStr = d3n.svgString();

  const componentFilePath = `site/src/generated/daily-chart${
    mobile ? "-mobile" : ""
  }.tsx`;
  const componentJs = await transform(
    svgStr,
    {
      typescript: true,
      svgo: false,
      plugins: ["@svgr/plugin-jsx", "@svgr/plugin-prettier"],
    },
    {
      componentName: `HomepageCasualtyChart${mobile ? "Mobile" : ""}`,
      filePath: componentFilePath,
    }
  );

  fs.writeFileSync(
    componentFilePath,
    componentJs.replace("<style>", "{props.children}\n\t\t<style>")
  );

  if (mobile) {
    json.mobile = {
      width,
      height,
      dayPoints,
      eventDotRadius,
    };
    // mobile is the last one to render so it renders the data json which backs both
    fs.writeFileSync(
      `site/src/generated/daily-chart.json`,
      JSON.stringify(json)
    );
  } else {
    json.width = width;
    json.height = height;
    json.dayPoints = dayPoints;
    json.eventDotRadius = eventDotRadius;
  }
};

render();
render({ mobile: true });
