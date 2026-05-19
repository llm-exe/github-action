import { formatActionOutput } from "./output";

describe("action output", () => {
  it("keeps string results as result output", () => {
    expect(formatActionOutput("hello")).toEqual({
      result: "hello",
      json: '"hello"',
    });
  });

  it("stringifies object results", () => {
    expect(formatActionOutput({ answer: "yes" })).toEqual({
      result: '{"answer":"yes"}',
      json: '{"answer":"yes"}',
    });
  });
});
