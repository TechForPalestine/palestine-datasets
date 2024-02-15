import range from "lodash/range";
import shuffle from "lodash/shuffle";
import pageInfo from "../../generated/killed-in-gaza/page-info.json";
import type { KilledInGaza } from "../../../../types/killed-in-gaza.types";
import { getMergedPages } from "./page.util";

export const getHeaderMarqueeInitialPage = () => {
  const pages = shuffle(range(1, pageInfo.pageCount + 1));
  const firstPageNumber = pages.shift();
  const secondPageNumber = pages.shift();
  const firstJson = `../../generated/killed-in-gaza/page-${firstPageNumber}.json`;
  const secondJson = `../../generated/killed-in-gaza/page-${secondPageNumber}.json`;
  const firstPage: KilledInGaza[] = require(firstJson);
  const secondPage: KilledInGaza[] = require(secondJson);
  const people = getMergedPages(firstPage, secondPage);
  return {
    people,
    pages,
  };
};
