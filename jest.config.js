module.exports = {
  roots: ["<rootDir>/src", "<rootDir>/test"],
  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx|js|jsx)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
