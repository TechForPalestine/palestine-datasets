import { transform } from "@svgr/core";
import pointAtLen from "point-at-length";
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

const getSvgDomain = (pathPoints) => {
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

const render = async () => {
  const svg = d3n
    .createSVG(width, height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("overflow", "visible")
    .attr("style", "border-bottom: 2px solid #eee;");

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

  const linePathId = "chartlinepath";

  const path = svg
    .append("path")
    .datum(data.chart)
    .attr("id", linePathId)
    .attr("fill", "url(#pathFillGradient)")
    .attr("stroke", "#347843")
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", "1060,1300")
    .attr("d", pathData);

  const desiredTickCount = 10;
  const xAxisPlan = data.slimData.length / desiredTickCount;
  const xAxisStep = Math.ceil(xAxisPlan / 5) * 5;
  const xAxisSteps: number[] = [0];
  const maxStep = xAxisStep * data.slimData.length;
  while (xAxisSteps[xAxisSteps.length - 1] < data.slimData.length) {
    const nextStep = xAxisSteps[xAxisSteps.length - 1] + xAxisStep;
    if (nextStep < maxStep) {
      xAxisSteps.push(nextStep);
    }
  }

  const pathDataValue = path.attr("d");
  const pathPoints = pointAtLen(pathDataValue);
  const svgDomain = getSvgDomain(pathPoints);
  const xAxisPoints = xAxisSteps.map((stepValue) => {
    const stepProgress =
      ((stepValue + 2) / data.slimData.length) * svgDomain.maxPathLength;
    const point = pathPoints.at(stepProgress);
    return point[0];
  });
  const pauseIndex = data.slimData.findIndex(
    ({ date }) => date === "2023-11-24"
  );
  const pauseProgress =
    ((pauseIndex + 2) / data.slimData.length) * svgDomain.maxPathLength;
  const pausePoint = pathPoints.at(pauseProgress);
  console.log({
    pauseIndex,
    svgDomain,
    pausePoint,
    xAxisStep,
    xAxisSteps,
    xAxisPoints,
  });

  svg.append("style").text(`
#${linePathId} {
  stroke: var(ifm-color-primary-darkest);
}
`);

  svg
    .append("circle")
    .attr("cx", pausePoint[0])
    .attr("cy", pausePoint[1])
    .attr("stroke-width", 2)
    .attr("stroke", "white")
    .attr("fill", "black")
    .attr("r", 9)
    .attr("filter", "url(#pausefilter)");

  svg
    .append("filter")
    .attr("id", "pausefilter")
    .attr("filterUnits", "userSpaceOnUse")
    .attr("color-interpolation-filters", "sRGB")
    .append("feDropShadow")
    .attr("dx", 2)
    .attr("dy", 2)
    .attr("stdDeviation", 2)
    .attr("floodOpacity", 0.3);

  xAxisPoints.forEach((x, i) => {
    svg
      .append("text")
      .attr("x", x)
      .attr("y", height + 30)
      .attr("text-anchor", "middle")
      .text(xAxisSteps[i]);
  });

  const defs = svg.append("defs");

  const pathFillGradient = defs.append("linearGradient");
  pathFillGradient.attr("id", "pathFillGradient");
  //x1="0" x2="0" y1="0" y2="1"
  pathFillGradient.attr("x1", "0");
  pathFillGradient.attr("x2", "0");
  pathFillGradient.attr("y1", "0");
  pathFillGradient.attr("y2", "1");
  pathFillGradient
    .append("stop")
    .attr("offset", "0")
    .attr("stop-color", "#B3D2C0");
  pathFillGradient
    .append("stop")
    .attr("offset", "1")
    .attr("stop-color", "white");

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
    JSON.stringify({ data: data.slimData, width })
  );
};

render();
