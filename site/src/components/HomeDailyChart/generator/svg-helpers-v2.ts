type D3NodeSvg = {
  append: (tag: string) => D3NodeSvg;
  attr: (name: string, value: string | number) => D3NodeSvg;
  text: (txt: string | number) => D3NodeSvg;
};

type IDScoper = (id: string) => string;

type ChartConstants = {
  markerDotRadius: number;
  width: number;
  height: number;
  mobile: boolean;
};

const addGradientDefinition = (svg: D3NodeSvg, id: IDScoper) => () => {
  const defs = svg.append("defs");

  const pathFillGradient = defs.append("linearGradient");
  pathFillGradient.attr("id", id("pathFillGradient"));
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
};

// Dashed vertical line + dot marking the day currently under the pointer.
// Rendered at its default ("today") position at build time; moved client-side
// via direct attribute updates as the visitor hovers/pans the chart.
const addMarkerDotLine =
  (svg: D3NodeSvg, id: IDScoper, { width, height, markerDotRadius }: ChartConstants) =>
  () => {
    svg
      .append("path")
      .attr("id", id("chartmarkerline"))
      .attr("d", `M${width} ${0} v${height}`)
      .attr("opacity", "0.85")
      .attr("stroke", "var(--tfp-chart-today-line)")
      .attr("stroke-width", "2")
      .attr("stroke-dasharray", "5")
      .attr("stroke-linecap", "round");

    svg
      .append("circle")
      .attr("id", id("chartmarkerdot"))
      .attr("cx", width)
      .attr("cy", 0)
      .attr("stroke-width", 2.5)
      .attr("stroke", "var(--tfp-chart-gradient-bottom-stop)")
      .attr("fill", "var(--tfp-chart-today-line)")
      .attr("r", markerDotRadius)
      .attr("filter", `url(#${id("dotShadow")})`);
  };

const addEventDotShadowFilter = (svg: D3NodeSvg, id: IDScoper, _: ChartConstants) => () => {
  svg
    .append("filter")
    .attr("id", id("dotShadow"))
    .attr("filterUnits", "userSpaceOnUse")
    .attr("color-interpolation-filters", "sRGB")
    .append("feDropShadow")
    .attr("dx", 2)
    .attr("dy", 2)
    .attr("stdDeviation", 2)
    .attr("floodOpacity", 0.2);
};

// Faint vertical guide marking a year boundary, with its label sitting just
// under the axis line.
const addYearGridline =
  (svg: D3NodeSvg, id: IDScoper, { height, mobile }: ChartConstants) =>
  ({ x, label }: { x: number; label: string }) => {
    svg
      .append("path")
      .attr("d", `M${x} 0 v${height}`)
      .attr("stroke", "var(--tfp-chart-line)")
      .attr("stroke-width", "1")
      .attr("opacity", "0.12");

    svg
      .append("text")
      .attr("x", x)
      .attr("y", height + 20)
      .attr("fill", "var(--tfp-chart-subtitle)")
      .attr("text-anchor", "middle")
      .attr("font-size", mobile ? "1.2em" : "1em")
      .attr("font-weight", "600")
      .text(label);
  };

export const bindHelpers = (svg: D3NodeSvg, id: IDScoper, c: ChartConstants) => ({
  addYearGridline: addYearGridline(svg, id, c),
  addMarkerDotLine: addMarkerDotLine(svg, id, c),
  addGradientDefinition: addGradientDefinition(svg, id),
  addEventDotShadowFilter: addEventDotShadowFilter(svg, id, c),
});
