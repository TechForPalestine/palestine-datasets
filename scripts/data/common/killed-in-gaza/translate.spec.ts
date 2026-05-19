import { describe, expect, test } from "bun:test";
import { fixStandaloneAllah, hasStandaloneAllah } from "./translate";

describe("hasStandaloneAllah", () => {
  test("returns true for standalone Allah segment", () => {
    expect(hasStandaloneAllah("Nasr Allah Al-Farra")).toBe(true);
    expect(hasStandaloneAllah("Ata Allah Mohammed")).toBe(true);
    expect(hasStandaloneAllah("Faraj Allah Yassin")).toBe(true);
  });

  test("returns false for merged allah segments", () => {
    expect(hasStandaloneAllah("Nasrallah")).toBe(false);
    expect(hasStandaloneAllah("Atallah")).toBe(false);
    expect(hasStandaloneAllah("Farajallah")).toBe(false);
  });

  test("returns false for names without allah", () => {
    expect(hasStandaloneAllah("Ahmed Mohammed Ali")).toBe(false);
  });

  test("returns false for allah within a word (not standalone)", () => {
    expect(hasStandaloneAllah("Nasarallah Al-Farra")).toBe(false);
  });
});

describe("fixStandaloneAllah", () => {
  test("merges standalone Allah with preceding word ending in 'a'", () => {
    expect(fixStandaloneAllah("Ata Allah")).toBe("Atallah");
    expect(fixStandaloneAllah("Faraj Allah")).toBe("Farajallah");
    expect(fixStandaloneAllah("Saad Allah")).toBe("Saadallah");
    expect(fixStandaloneAllah("Awad Allah")).toBe("Awadallah");
  });

  test("merges standalone Allah with preceding word not ending in 'a'", () => {
    expect(fixStandaloneAllah("Nasr Allah")).toBe("Nasrallah");
    expect(fixStandaloneAllah("Deif Allah")).toBe("Deifallah");
    expect(fixStandaloneAllah("Jad Allah")).toBe("Jadallah");
  });

  test("handles multiple standalone Allah segments", () => {
    expect(fixStandaloneAllah("Awad Allah Awad Allah")).toBe(
      "Awadallah Awadallah"
    );
  });

  test("merges standalone Allah in the middle of a full name", () => {
    expect(fixStandaloneAllah("Salwa Suleiman Nasr Allah Al-Farra")).toBe(
      "Salwa Suleiman Nasrallah Al-Farra"
    );
    expect(fixStandaloneAllah("Said Ata Allah Mohammed Abu Jalala")).toBe(
      "Said Atallah Mohammed Abu Jalala"
    );
  });

  test("handles standalone Allah at end of name", () => {
    expect(fixStandaloneAllah("Ali Mousa Mohammed Khalaf Allah")).toBe(
      "Ali Mousa Mohammed Khalafallah"
    );
  });

  test("does not modify names without standalone Allah", () => {
    expect(fixStandaloneAllah("Nasrallah Al-Farra")).toBe("Nasrallah Al-Farra");
    expect(fixStandaloneAllah("Ahmed Mohammed Ali")).toBe("Ahmed Mohammed Ali");
  });

  test("handles case-insensitive Allah matching", () => {
    expect(fixStandaloneAllah("Nasr allah")).toBe("Nasrallah");
    expect(fixStandaloneAllah("Ata ALLAH")).toBe("Atallah");
  });

  test("collapses double 'a' when preceding segment ends with 'a'", () => {
    // "Ata" + "allah" → "Atallah" (not "Ataallah")
    expect(fixStandaloneAllah("Ata Allah")).toBe("Atallah");
    // "Saq" + "allah" → "Saqallah" (no collapse, 'q' doesn't end in 'a')
    expect(fixStandaloneAllah("Saq Allah")).toBe("Saqallah");
    // "Ouda" + "allah" → "Oudallah" (not "Oudaallah")
    expect(fixStandaloneAllah("Ouda Allah")).toBe("Oudallah");
  });
});
