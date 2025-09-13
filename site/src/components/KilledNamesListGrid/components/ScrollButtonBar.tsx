import { MutableRefObject } from "react";
import { ScrollArrowIcon } from "../../ScrollArrowIcon";
import styles from "./ScrollButtonBar.module.css";
import { GridImperativeAPI } from "react-window";

const hint = (direction: "up" | "down", end: boolean) => {
  if (end) {
    return direction === "up" ? "Scroll to top" : "Scroll to bottom";
  }

  return direction === "up" ? "Scroll up" : "Scroll down";
};

const Button = ({
  onPress,
  direction,
  end,
}: {
  onPress?: () => void;
  direction: "up" | "down";
  end?: boolean;
}) => {
  return (
    <div
      onClick={onPress}
      className={styles.button}
      title={hint(direction, end)}
    >
      <ScrollArrowIcon down={direction === "down"} end={end} size={30} />
    </div>
  );
};

export const ScrollButtonBar = ({
  gridRef,
  thresholdIndex,
  maxRowIndex,
  recordsVisibleInWindowViewport,
}: {
  gridRef: MutableRefObject<GridImperativeAPI>;
  thresholdIndex: number;
  maxRowIndex: number;
  recordsVisibleInWindowViewport: number;
}) => {
  const onPressScrollTop = () => {
    gridRef.current.scrollToRow({
      behavior: "smooth",
      index: 0,
    });
  };

  const onPressScrollUp = () => {
    const offset = thresholdIndex - recordsVisibleInWindowViewport * 2;

    gridRef.current.scrollToRow({
      behavior: "smooth",
      index: offset > 0 ? offset : 0,
    });
  };

  const onPressScrollDown = () => {
    const offset = thresholdIndex + recordsVisibleInWindowViewport;

    gridRef.current.scrollToRow({
      behavior: "smooth",
      index: offset,
    });
  };

  const onPressScrollBottom = () => {
    gridRef.current.scrollToRow({
      behavior: "smooth",
      index: maxRowIndex,
    });
  };

  return (
    <div className={styles.bar}>
      <Button direction="up" end onPress={onPressScrollTop} />
      <Button direction="up" onPress={onPressScrollUp} />
      <Button direction="down" onPress={onPressScrollDown} />
      <Button direction="down" end onPress={onPressScrollBottom} />
    </div>
  );
};
