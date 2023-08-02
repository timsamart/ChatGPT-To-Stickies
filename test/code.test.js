// code.test.js

import { parseNotes } from "../src/utils";

describe("parseNotes", () => {
  test("should parse notes correctly, handle notes without titles, handle multiple ':' and ignore empty lines", () => {
    const notes = `
      **Title1**: Content1

      Content2
      Content2secondpart

      **Title2**: 

      **Title3**: Content:3:with:colons

      **Title4**

      **Title5**: Content5

      **Title6**: Content6
      Title7: Content7
      Title8: Content8
    `;
    const expected = [
      { title: "Title1", content: "Content1" },
      { title: "", content: "Content2 Content2secondpart" },
      { title: "", content: "Title2" },
      { title: "Title3", content: "Content:3:with:colons" },
      { title: "", content: "Title4" },
      { title: "Title5", content: "Content5" },
      { title: "Title6", content: "Content6" },
      { title: "Title7", content: "Content7" },
      { title: "Title8", content: "Content8" },
    ];
    expect(parseNotes(notes)).toEqual(expected);
  });
});
