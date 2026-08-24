import { describe, expect, test } from "bun:test";
import { buildFilterQueryString, parseUrlFilterParams } from "./urlParams";

describe("parseUrlFilterParams", () => {
  test("returns empty defaults when no params present", () => {
    expect(parseUrlFilterParams("")).toEqual({
      excluded: [],
      search: "",
      ageRange: null,
      listUpdates: [],
    });
  });

  test("parses a single excluded person type", () => {
    expect(parseUrlFilterParams("?excluded=man")).toEqual({
      excluded: ["man"],
      search: "",
      ageRange: null,
      listUpdates: [],
    });
  });

  test("parses multiple pipe-delimited excluded person types", () => {
    const result = parseUrlFilterParams("?excluded=man|woman|boy");
    expect(result.excluded.sort()).toEqual(["boy", "man", "woman"]);
  });

  test("dedupes repeated excluded values", () => {
    const result = parseUrlFilterParams("?excluded=man|man|woman");
    expect(result.excluded.sort()).toEqual(["man", "woman"]);
  });

  test("drops unrecognized person type values", () => {
    expect(parseUrlFilterParams("?excluded=man|not-a-type")).toEqual({
      excluded: ["man"],
      search: "",
      ageRange: null,
      listUpdates: [],
    });
  });

  test("parses the search param", () => {
    expect(parseUrlFilterParams("?search=ahmed")).toEqual({
      excluded: [],
      search: "ahmed",
      ageRange: null,
      listUpdates: [],
    });
  });

  test("parses a valid age range", () => {
    expect(parseUrlFilterParams("?ages=5-12")).toEqual({
      excluded: [],
      search: "",
      ageRange: [5, 12],
      listUpdates: [],
    });
  });

  test("rejects an age range with min greater than max", () => {
    expect(parseUrlFilterParams("?ages=12-5").ageRange).toBeNull();
  });

  test("rejects a malformed age range", () => {
    expect(parseUrlFilterParams("?ages=abc").ageRange).toBeNull();
    expect(parseUrlFilterParams("?ages=5").ageRange).toBeNull();
  });

  test("ignores excluded param when a valid age range is present", () => {
    const result = parseUrlFilterParams("?ages=5-12&excluded=man|woman");
    expect(result.ageRange).toEqual([5, 12]);
    expect(result.excluded).toEqual([]);
  });

  test("parses excluded, search, and ages together", () => {
    const result = parseUrlFilterParams("?excluded=man&search=ahmed");
    expect(result).toEqual({
      excluded: ["man"],
      search: "ahmed",
      ageRange: null,
      listUpdates: [],
    });
  });

  test("parses a single list update number", () => {
    expect(parseUrlFilterParams("?updates=3").listUpdates).toEqual([3]);
  });

  test("parses multiple pipe-delimited list update numbers", () => {
    expect(parseUrlFilterParams("?updates=3|5|8").listUpdates.sort((a, b) => a - b)).toEqual([
      3, 5, 8,
    ]);
  });

  test("dedupes repeated list update numbers", () => {
    expect(parseUrlFilterParams("?updates=3|3|5").listUpdates.sort((a, b) => a - b)).toEqual([
      3, 5,
    ]);
  });

  test("drops non-numeric or non-positive list update values", () => {
    expect(parseUrlFilterParams("?updates=3|abc|0|-1|5").listUpdates.sort((a, b) => a - b)).toEqual(
      [3, 5],
    );
  });

  test("combines list updates with other active filters", () => {
    const result = parseUrlFilterParams("?updates=3&excluded=man&search=ahmed");
    expect(result).toEqual({
      excluded: ["man"],
      search: "ahmed",
      ageRange: null,
      listUpdates: [3],
    });
  });

  test("combines list updates alongside an active age range", () => {
    const result = parseUrlFilterParams("?updates=3&ages=5-12");
    expect(result.ageRange).toEqual([5, 12]);
    expect(result.listUpdates).toEqual([3]);
  });
});

describe("buildFilterQueryString", () => {
  test("returns empty string when nothing is filtered", () => {
    const qs = buildFilterQueryString({
      filters: ["elderly-man", "elderly-woman", "man", "woman", "boy", "girl"],
      search: "",
      ageRange: null,
    });
    expect(qs).toBe("");
  });

  test("encodes excluded types derived from the active filter selection", () => {
    const qs = buildFilterQueryString({
      filters: ["elderly-woman", "woman", "boy", "girl"],
      search: "",
      ageRange: null,
    });
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("excluded")?.split("|").sort()).toEqual(["elderly-man", "man"]);
  });

  test("encodes a trimmed search term", () => {
    const qs = buildFilterQueryString({
      filters: ["elderly-man", "elderly-woman", "man", "woman", "boy", "girl"],
      search: "  ahmed  ",
      ageRange: null,
    });
    expect(qs).toBe("?search=ahmed");
  });

  test("encodes an age range and omits excluded", () => {
    const qs = buildFilterQueryString({
      filters: ["man"],
      search: "",
      ageRange: [5, 12],
    });
    expect(qs).toBe("?ages=5-12");
  });

  test("combines search with excluded filters", () => {
    const qs = buildFilterQueryString({
      filters: ["elderly-man", "elderly-woman", "man", "woman", "boy", "girl"].filter(
        (t) => t !== "man",
      ) as never,
      search: "ahmed",
      ageRange: null,
    });
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("excluded")).toBe("man");
    expect(params.get("search")).toBe("ahmed");
  });

  test("omits search param when search is blank/whitespace only", () => {
    const qs = buildFilterQueryString({
      filters: ["elderly-man", "elderly-woman", "man", "woman", "boy", "girl"],
      search: "   ",
      ageRange: null,
    });
    expect(qs).toBe("");
  });

  test("omits the updates param when listUpdates is absent or empty", () => {
    expect(
      buildFilterQueryString({
        filters: ["elderly-man", "elderly-woman", "man", "woman", "boy", "girl"],
        search: "",
        ageRange: null,
      }),
    ).toBe("");
    expect(
      buildFilterQueryString({
        filters: ["elderly-man", "elderly-woman", "man", "woman", "boy", "girl"],
        search: "",
        ageRange: null,
        listUpdates: [],
      }),
    ).toBe("");
  });

  test("encodes a single list update number", () => {
    const qs = buildFilterQueryString({
      filters: ["elderly-man", "elderly-woman", "man", "woman", "boy", "girl"],
      search: "",
      ageRange: null,
      listUpdates: [3],
    });
    expect(qs).toBe("?updates=3");
  });

  test("encodes multiple list update numbers pipe-delimited", () => {
    const qs = buildFilterQueryString({
      filters: ["elderly-man", "elderly-woman", "man", "woman", "boy", "girl"],
      search: "",
      ageRange: null,
      listUpdates: [3, 5, 8],
    });
    expect(qs).toBe("?updates=3%7C5%7C8");
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("updates")).toBe("3|5|8");
  });

  test("combines list updates with search and excluded filters", () => {
    const qs = buildFilterQueryString({
      filters: ["elderly-man", "elderly-woman", "man", "woman", "boy", "girl"].filter(
        (t) => t !== "man",
      ) as never,
      search: "ahmed",
      ageRange: null,
      listUpdates: [3],
    });
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("excluded")).toBe("man");
    expect(params.get("search")).toBe("ahmed");
    expect(params.get("updates")).toBe("3");
  });

  test("combines list updates with an age range", () => {
    const qs = buildFilterQueryString({
      filters: ["man"],
      search: "",
      ageRange: [5, 12],
      listUpdates: [3],
    });
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("ages")).toBe("5-12");
    expect(params.get("updates")).toBe("3");
  });
});
