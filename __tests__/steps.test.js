jest.mock(
  "openai",
  () => {
    return jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest
            .fn()
            .mockResolvedValue({
              choices: [{ message: { content: "mocked" } }],
            }),
        },
      },
    }));
  },
  { virtual: true },
);

const { calculateSteps } = require("../utils/geometry");

describe("calculateSteps", () => {
  test("calculates step count from inches", () => {
    expect(calculateSteps(29)).toBe(4);
  });

  test("handles string input", () => {
    expect(calculateSteps("14.5")).toBe(2);
  });

  test("invalid input returns 0", () => {
    expect(calculateSteps("foo")).toBe(0);
  });
});
