import { parseNotes } from "../src/utils";

describe("parseNotes", () => {
  test("should parse notes correctly and remove **", () => {
    const notes =
      "**Title1**: Content1\n\n**Title2**: Content2\n**Title3**: Content3";
    const expected = [
      { title: "Title1", content: "Content1" },
      { title: "Title2", content: "Content2" },
      { title: "Title3", content: "Content3" },
    ];
    expect(parseNotes(notes)).toEqual(expected);
  });
});
