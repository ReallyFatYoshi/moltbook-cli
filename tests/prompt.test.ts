import readline from "readline";
import { prompt } from "../src/prompt";

jest.mock("readline");

describe("prompt", () => {
  test("returns trimmed input and closes", async () => {
    const close = jest.fn();
    const question = jest.fn((_: string, cb: (ans: string) => void) =>
      cb("  hello  "),
    );

    (readline.createInterface as jest.Mock).mockReturnValue({
      question,
      close,
    });

    const result = await prompt("Name: ");

    expect(result).toBe("hello");
    expect(close).toHaveBeenCalled();
  });
});
