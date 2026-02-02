import { startUI } from "../src/ui";

describe("startUI", () => {
  test("loads feed and renders", async () => {
    const screen = { key: jest.fn(), render: jest.fn() } as any;
    const feedBox = { setItems: jest.fn(), focus: jest.fn() } as any;
    const postBox = {
      key: jest.fn(),
      getValue: jest.fn(() => ""),
      clearValue: jest.fn(),
    } as any;
    const logBox = { log: jest.fn() } as any;

    const blessedLib = {
      screen: jest.fn(() => screen),
      list: jest.fn(() => feedBox),
      textbox: jest.fn(() => postBox),
      log: jest.fn(() => logBox),
    } as any;

    const getFeed = jest.fn(async () => ({ data: [{ title: "A" }] }));
    const createPost = jest.fn(async () => ({}));

    await startUI({
      apiKey: "token",
      getFeed,
      createPost,
      blessedLib,
      onExit: jest.fn(),
    });

    expect(getFeed).toHaveBeenCalledWith(1, 10);
    expect(feedBox.setItems).toHaveBeenCalledWith(["A"]);
    expect(screen.render).toHaveBeenCalled();
  });

  test("posts on enter and reloads feed", async () => {
    const screen = { key: jest.fn(), render: jest.fn() } as any;
    const feedBox = { setItems: jest.fn(), focus: jest.fn() } as any;
    let enterHandler: (() => Promise<void>) | undefined;

    const postBox = {
      key: jest.fn((key: string, handler: () => Promise<void>) => {
        if (key === "enter") enterHandler = handler;
      }),
      getValue: jest.fn(() => "Hello"),
      clearValue: jest.fn(),
    } as any;

    const logBox = { log: jest.fn() } as any;

    const blessedLib = {
      screen: jest.fn(() => screen),
      list: jest.fn(() => feedBox),
      textbox: jest.fn(() => postBox),
      log: jest.fn(() => logBox),
    } as any;

    const getFeed = jest
      .fn()
      .mockResolvedValueOnce({ data: [{ title: "A" }] })
      .mockResolvedValueOnce({ data: [{ title: "B" }] });
    const createPost = jest.fn(async () => ({}));

    await startUI({
      apiKey: "token",
      getFeed,
      createPost,
      blessedLib,
      onExit: jest.fn(),
    });

    if (!enterHandler) throw new Error("enter handler not registered");
    await enterHandler();

    expect(createPost).toHaveBeenCalledWith("Hello");
    expect(getFeed).toHaveBeenCalledTimes(2);
    expect(getFeed).toHaveBeenLastCalledWith(1, 10);
  });
});
