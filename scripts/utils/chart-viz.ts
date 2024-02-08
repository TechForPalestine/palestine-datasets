import { CasualtyDailyReportV2 } from "../../types/casualties-daily.types";

const fs = require("fs");
const D3Node = require("d3-node");
const d3n = new D3Node();
const { d3 } = d3n;

const width = 300;
const height = 150;

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

const render = async () => {
  const svg = d3n
    .createSVG(width, height)
    .attr("viewBox", `0 0 ${width} ${height}`);

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

  svg
    .append("path")
    .datum(data.chart)
    .attr("id", "chartpath")
    .attr("fill", "rgba(100,40,40,1)")
    .attr("stroke", "rgba(168, 44, 44, 1)")
    .attr("stroke-width", 1)
    .attr("mask", "url(#mask)")
    .attr("d", pathData);

  svg.append("style").text(`
path {
  stroke: var(--ifm-color-primary-light);
  fill: var(--ifm-color-primary-lightest);
}
`);

  const defs = svg.append("defs");

  const maskGradient = defs.append("linearGradient");
  maskGradient.attr("id", "maskgradient");
  maskGradient.append("stop").attr("offset", "0").attr("stop-color", "white");
  maskGradient
    .append("stop")
    .attr("offset", "0.9")
    .attr("stop-color", "rgb(100,100,100)");
  maskGradient.append("stop").attr("offset", "1").attr("stop-color", "black");

  const mask = defs.append("mask").attr("id", "mask");
  const maskRect = mask.append("rect");
  maskRect
    .attr("id", "svgmask")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "url(#maskgradient)");

  const svgStr = d3n.svgString();
  fs.writeFileSync("site/src/generated/daily-chart.svg", svgStr);
  fs.writeFileSync(
    "site/src/generated/daily-chart.json",
    JSON.stringify({ data: data.slimData, width })
  );
};

render();
