import range from "lodash/range";
import shuffle from "lodash/shuffle";
import pageInfo from "../../generated/killed-in-gaza/page-info.json";
import type { KilledInGaza } from "../../../../types/killed-in-gaza.types";
import { getMarqueeRowsFromPage } from "./page.util";

export const getHeaderMarqueeInitialPage = () => {
  const pages = shuffle(range(1, pageInfo.pageCount + 1));
  const firstPageNumber = pages.shift();
  const firstJson = `../../generated/killed-in-gaza/page-${firstPageNumber}.json`;
  const firstPage: KilledInGaza[] = require(firstJson);
  const people = getMarqueeRowsFromPage(firstPage);
  return {
    people,
    pages,
  };
};
