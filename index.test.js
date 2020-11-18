const { Toolkit } = require("actions-toolkit");

describe("Add Reviewed-by trailer", () => {
  let action, tools;

  // Mock Toolkit.run to define `action` so we can call it
  Toolkit.run = jest.fn((actionFn) => {
    action = actionFn;
  });
  // Load up our entrypoint file
  require(".");

  beforeEach(() => {
    jest.resetModules();

    tools = mockEvent("pull_request_review", {
      action: "submitted",
      pull_request: {
        body: "This is an example body",
        number: 27,
      },
      review: {
        user: {
          login: "mheap",
        },
      },
      repository: {
        owner: {
          login: "mheap",
        },
        name: "action-test",
      },
    });
  });

  it("works and makes API calls as a run harness", async () => {
    tools.exit.success = jest.fn();
    await action(tools);
    expect(tools.exit.success).toHaveBeenCalled();
    expect(tools.exit.success).toHaveBeenCalledWith("We did it!");
  });
});

function mockEvent(name, mockPayload) {
  jest.mock(
    "/github/workspace/event.json",
    () => {
      return mockPayload;
    },
    {
      virtual: true,
    }
  );

  process.env.GITHUB_EVENT_NAME = name;
  process.env.GITHUB_EVENT_PATH = "/github/workspace/event.json";

  return new Toolkit();
}
