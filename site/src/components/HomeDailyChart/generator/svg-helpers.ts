type D3NodeSvg = {
  append: (tag: string) => D3NodeSvg;
  attr: (name: string, value: string | number) => D3NodeSvg;
  text: (txt: string | number) => D3NodeSvg;
};

type IDScoper = (id: string) => string;

type ChartConstants = {
  eventDotRadius: number;
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

const addMovableDotLine =
  (
    svg: D3NodeSvg,
    id: IDScoper,
    { width, height, eventDotRadius }: ChartConstants
  ) =>
  () => {
    svg
      .append("path")
      .attr("id", id("chartsliderline"))
      .attr("d", `M${width} ${0} v${height}`)
      .attr("opacity", "0.8")
      .attr("stroke", "var(--tfp-chart-today-line)")
      .attr("stroke-width", "2")
      .attr("stroke-dasharray", "5")
      .attr("stroke-linecap", "round");

    svg
      .append("circle")
      .attr("id", id("chartsliderdot"))
      .attr("cx", width)
      .attr("cy", 0)
      .attr("stroke-width", 2)
      .attr("stroke", "white")
      .attr("fill", "#CA3A32")
      .attr("r", eventDotRadius)
      .attr("filter", `url(#${id("dotShadow")})`);
  };

const addAxisTickLabel =
  (svg: D3NodeSvg, id: IDScoper, { height, mobile }: ChartConstants) =>
  ({
    i,
    x,
    lastTick,
    xAxisSteps,
  }: {
    i: number;
    x: number;
    lastTick: boolean;
    xAxisSteps: number[];
  }) => {
    svg
      .append("text")
      .attr("x", x - 10)
      .attr("y", height + 30)
      .attr("fill", "#777")
      .attr("text-anchor", "middle")
      .attr("font-size", mobile ? "1.2em" : "1em")
      .text(lastTick ? "TODAY" : xAxisSteps[i]);
  };

const addKilledCountLabelOverlay =
  (svg: D3NodeSvg, id: IDScoper, { width, height, mobile }: ChartConstants) =>
  (latestKilledValue: string) => {
    const countLabelY = (height * 3) / 5;
    svg
      .append("text")
      .attr("id", id("chartcount"))
      .attr("text-anchor", "end")
      .attr("font-size", mobile ? 60 : 80)
      .attr("font-weight", "bold")
      .attr("fill", "var(--tfp-chart-killed-count)")
      .attr("opacity", "0.6")
      .attr("x", width - 10)
      .attr("y", countLabelY)
      .text(latestKilledValue);
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("font-size", mobile ? 35 : 40)
      .attr("font-weight", "bold")
      .attr("fill", "var(--tfp-chart-killed-count)")
      .attr("opacity", "0.6")
      .attr("x", width - 12)
      .attr("y", countLabelY + 40)
      .text("killed");
  };

const addEventDotShadowFilter =
  (svg: D3NodeSvg, id: IDScoper, _: ChartConstants) => () => {
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

const addEventPoint =
  (
    svg: D3NodeSvg,
    id: IDScoper,
    { eventDotRadius, height, mobile }: ChartConstants
  ) =>
  ({
    eventLabel,
    eventPoint,
    dotOffset,
    eventLineLabelOffset,
    eventLabelBottomOffset,
  }: {
    eventLabel: string;
    eventPoint: [number, number];
    dotOffset: number;
    eventLineLabelOffset: number;
    eventLabelBottomOffset: number;
  }) => {
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
      .attr("filter", `url(#${id("dotShadow")})`);

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
      .attr("font-size", mobile ? "1.2em" : "1em")
      .attr("text-anchor", "middle")
      .text(eventLabel);
  };

export const bindHelpers = (
  svg: D3NodeSvg,
  id: IDScoper,
  c: ChartConstants
) => ({
  addEventPoint: addEventPoint(svg, id, c),
  addAxisTickLabel: addAxisTickLabel(svg, id, c),
  addMovableDotLine: addMovableDotLine(svg, id, c),
  addGradientDefinition: addGradientDefinition(svg, id),
  addEventDotShadowFilter: addEventDotShadowFilter(svg, id, c),
  addKilledCountLabelOverlay: addKilledCountLabelOverlay(svg, id, c),
});
