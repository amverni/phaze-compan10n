import { expect, it } from "vitest";
import { editGenericPoints, parseGenericPoints } from "./genericPoints";

it("keeps keypad edits canonical across zero, signed magnitudes, and erasure", () => {
  let value = "0";
  for (const key of ["0", "-", "+", "Backspace", "Delete"]) {
    value = editGenericPoints(value, key);
    expect(value).toBe("0");
  }
  value = editGenericPoints(value, "1");
  expect(value).toBe("1");
  value = editGenericPoints(value, "2");
  expect(value).toBe("12");
  value = editGenericPoints(value, "-");
  expect(value).toBe("-12");
  value = editGenericPoints(value, "Backspace");
  expect(value).toBe("-1");
  value = editGenericPoints(value, "Backspace");
  expect(value).toBe("0");
  value = editGenericPoints(value, "7");
  value = editGenericPoints(value, "-");
  expect(value).toBe("-7");
  expect(editGenericPoints(value, "+")).toBe("7");
  expect(editGenericPoints(value, "-")).toBe("7");
  expect(editGenericPoints(value, "Delete")).toBe("0");
});

it.each([
  "1.5",
  "1e2",
  "9007199254740992",
])("retains genuine invalid input %s for validation instead of silently changing its meaning", (input) => {
  const value = [...input].reduce(editGenericPoints, "0");
  expect(value).toBe(input);
  expect(() => parseGenericPoints(value)).toThrow();
  expect(editGenericPoints(value, "Delete")).toBe("0");
});
