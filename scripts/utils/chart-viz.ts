import { transform } from "@svgr/core";
import pointAtLen from "point-at-length";
import chartEvents from "./chart_events.json";
import { CasualtyDailyReportV2 } from "../../types/casualties-daily.types";

const fs = require("fs");
const D3Node = require("d3-node");
const d3n = new D3Node();
const { d3 } = d3n;

const width = 1000;
const height = 300;

type SlimData = {
  date: CasualtyDailyReportV2["report_date"];
  injured: CasualtyDailyReportV2["ext_injured_cum"];
  civdef: CasualtyDailyReportV2["ext_civdef_killed_cum"];
  children: CasualtyDailyReportV2["ext_killed_children_cum"];
  women: CasualtyDailyReportV2["ext_killed_women_cum"];
  killed: CasualtyDailyReportV2["ext_killed_cum"];
  massacres: CasualtyDailyReportV2["ext_massacres_cum"];
  medical: CasualtyDailyReportV2["ext_med_killed_cum"];
  press: CasualtyDailyReportV2["ext_press_killed_cum"];
};

type MappedData = {
  chart: Array<{ date: Date; value: number }>;
  slimData: SlimData[];
};

const getSvgDomain = (pathPoints: ReturnType<typeof pointAtLen>) => {
  const aspectRatio = width / height;

  // calc svg domain
  let topRightSvgPos;
  let maxPathLength = 0;
  let tries = 0;

  const svgPathLengthSearchTryLimit = 100;
  const svgPathSearchStartLength = width;

  while (!topRightSvgPos && tries < svgPathLengthSearchTryLimit) {
    const point = pathPoints.at(svgPathSearchStartLength + tries);
    if (Math.round(point[0]) === width && Math.round(point[1]) === 0) {
      maxPathLength = svgPathSearchStartLength + tries;
      break;
    }
    tries++;
  }

  if (!maxPathLength) {
    throw new Error("Could not resolve maxPathLength");
  }

  return { maxPathLength, aspectRatio };
};

const render = async ({ mobile } = { mobile: false }) => {
  const svg = d3n
    .createSVG(width, height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("overflow", "visible");

  // bottom axis line
  svg
    .append("path")
    .attr("d", `M0 ${height} h${width}`)
    .attr("stroke", "var(--tfp-chart-axis-line)")
    .attr("stroke-width", "4");

  const dailyTimeSeries: CasualtyDailyReportV2[] = require("../../casualties_daily.min.json");

  const data = dailyTimeSeries.reduce(
    (
      acc,
      {
        report_date,
        ext_civdef_killed_cum,
        ext_injured_cum,
        ext_killed_children_cum,
        ext_killed_cum,
        ext_killed_women_cum,
        ext_massacres_cum,
        ext_med_killed_cum,
        ext_press_killed_cum,
      },
      day: number
    ) => ({
      ...acc,
      // just keep what we plan to surface in our UI
      slimData: acc.slimData.concat({
        date: report_date,
        civdef: ext_civdef_killed_cum,
        injured: ext_injured_cum,
        children: ext_killed_children_cum,
        killed: ext_killed_cum,
        women: ext_killed_women_cum,
        massacres: ext_massacres_cum,
        medical: ext_med_killed_cum,
        press: ext_press_killed_cum,
      }),
      chart: acc.chart.concat({
        date: d3.timeParse("%Y-%m-%d")(report_date),
        value: ext_killed_cum,
      }),
    }),
    {
      chart: [],
      slimData: [],
    } as MappedData
  );

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
    .attr("id", linePathId)
    .attr("fill", "url(#pathFillGradient)")
    .attr("stroke", "var(--ifm-color-primary-darker)")
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", "1060,1300")
    .attr("stroke-linecap", "round")
    .attr("d", pathData);

  const desiredTickCount = 10;
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
  const svgDomain = getSvgDomain(pathPoints);
  const daySegmentLength = svgDomain.maxPathLength / days;
  const dayPoints = Array.from(new Array(days)).map((_, i) => {
    return pathPoints.at((i + 1) * daySegmentLength);
  });

  const axisStepMinDistance = width * 0.05;
  const xAxisPoints = xAxisSteps.reduce((points, stepValue) => {
    const stepProgress = ((stepValue + 1) / days) * svgDomain.maxPathLength;
    const point = pathPoints.at(stepProgress);
    const lastPointX = points[points.length - 1]?.[0] ?? 0;
    if (point[0] < lastPointX + axisStepMinDistance) {
      return points;
    }
    return points.concat([point]);
  }, [] as [number, number][]);

  const eventDotRadius = 9;
  const dotOffset = eventDotRadius * 2;
  const eventLabelBottomOffset = 20;
  const eventLineLabelOffset = 25;

  chartEvents.forEach((chartEvent) => {
    const eventIndex = data.slimData.findIndex(
      ({ date }) => date === chartEvent.date
    );
    const eventTimeProgress =
      ((eventIndex + 1) / days) * svgDomain.maxPathLength;
    const eventPoint = pathPoints.at(eventTimeProgress);
    const dotX = eventPoint[0];
    const dotY = eventPoint[1];
    svg
      .append("circle")
      .attr("cx", dotX)
      .attr("cy", dotY)
      .attr("stroke-width", 2)
      .attr("stroke", "white")
      .attr("fill", "#333")
      .attr("r", eventDotRadius)
      .attr("filter", "url(#dotShadow)");

    // vertical dash line
    svg
      .append("path")
      .attr(
        "d",
        `M${dotX} ${dotY + dotOffset} v${
          height -
          dotY -
          dotOffset -
          eventLineLabelOffset -
          eventLabelBottomOffset
        }`
      )
      .attr("stroke", "#AAA")
      .attr("stroke-width", "2")
      .attr("stroke-dasharray", "5")
      .attr("stroke-linecap", "round")
      .attr("opacity", "0.5");

    svg
      .append("text")
      .attr("x", dotX)
      .attr("y", height - eventLabelBottomOffset)
      .attr("fill", "#777")
      .attr("text-anchor", "middle")
      .text(chartEvent.label);
  });

  svg
    .append("filter")
    .attr("id", "dotShadow")
    .attr("filterUnits", "userSpaceOnUse")
    .attr("color-interpolation-filters", "sRGB")
    .append("feDropShadow")
    .attr("dx", 2)
    .attr("dy", 2)
    .attr("stdDeviation", 2)
    .attr("floodOpacity", 0.2);

  // main count label
  const latestKilledValue = new Intl.NumberFormat().format(
    data.slimData[data.slimData.length - 1].killed
  );
  const countLabelY = (height * 3) / 5;
  svg
    .append("text")
    .attr("id", "chartcount")
    .attr("text-anchor", "end")
    .attr("font-size", 80)
    .attr("font-weight", "bold")
    .attr("fill", "var(--tfp-chart-killed-count)")
    .attr("opacity", "0.6")
    .attr("x", width - 10)
    .attr("y", countLabelY)
    .text(latestKilledValue);
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("font-size", 40)
    .attr("font-weight", "bold")
    .attr("fill", "var(--tfp-chart-killed-count)")
    .attr("opacity", "0.6")
    .attr("x", width - 12)
    .attr("y", countLabelY + 40)
    .text("killed");

  xAxisPoints.forEach((point, i) => {
    const lastTick = i === xAxisPoints.length - 1;
    const [x, y] = point;

    svg
      .append("text")
      .attr("x", x - 10)
      .attr("y", height + 30)
      .attr("fill", "#777")
      .attr("text-anchor", "middle")
      .text(lastTick ? "TODAY" : xAxisSteps[i]);

    if (lastTick) {
      //
      // movable dot for "TODAY"
      //

      svg
        .append("path")
        .attr("id", "chartsliderline")
        .attr("d", `M${width} ${y} v${height - y}`)
        .attr("opacity", "0.8")
        .attr("stroke", "var(--tfp-chart-today-line)")
        .attr("stroke-width", "2")
        .attr("stroke-dasharray", "5")
        .attr("stroke-linecap", "round");

      svg
        .append("circle")
        .attr("id", "chartsliderdot")
        .attr("cx", width)
        .attr("cy", y)
        .attr("stroke-width", 2)
        .attr("stroke", "white")
        .attr("fill", "#CA3A32")
        .attr("r", eventDotRadius)
        .attr("filter", "url(#dotShadow)");
    }
  });

  const defs = svg.append("defs");

  const pathFillGradient = defs.append("linearGradient");
  pathFillGradient.attr("id", "pathFillGradient");
  pathFillGradient.attr("x1", "0");
  pathFillGradient.attr("x2", "0");
  pathFillGradient.attr("y1", "0");
  pathFillGradient.attr("y2", "1");
  pathFillGradient
    .append("stop")
    .attr("offset", "0")
    .attr("stop-color", "var(--tfp-chart-gradient-top-stop)");
  pathFillGradient
    .append("stop")
    .attr("offset", "1")
    .attr("stop-color", "var(--tfp-chart-gradient-bottom-stop)");

  const svgStr = d3n.svgString();

  const componentFilePath = "site/src/generated/daily-chart.tsx";
  const componentJs = await transform(
    svgStr,
    {
      typescript: true,
      svgo: false,
      plugins: ["@svgr/plugin-jsx", "@svgr/plugin-prettier"],
    },
    { componentName: "HomepageCasualtyChart", filePath: componentFilePath }
  );

  fs.writeFileSync(
    componentFilePath,
    componentJs.replace("<style>", "{props.children}\n\t\t<style>")
  );
  fs.writeFileSync(
    "site/src/generated/daily-chart.json",
    JSON.stringify({
      data: data.slimData,
      width,
      height,
      dayPoints,
      eventDotRadius,
    })
  );
};

render();
