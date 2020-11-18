const { Toolkit } = require("actions-toolkit");

const mockedEnv = require("mocked-env");
const nock = require("nock");
nock.disableNetConnect();

describe("Add Reviewed-by trailer", () => {
  let action, restore, restoreTest;

  // Mock Toolkit.run to define `action` so we can call it
  Toolkit.run = jest.fn((actionFn) => {
    action = actionFn;
  });
  require(".");

  const validRequest = {
    action: "submitted",
    pull_request: {
      body: "This is an example body",
      number: 27,
    },
    review: {
      user: {
        login: "mheap",
      },
      state: "approved",
    },
    repository: {
      owner: {
        login: "mheap",
      },
      name: "test-repo-reviewed-by-trailer",
    },
  };

  beforeEach(() => {
    jest.resetModules();

    // Default in case the test does not use per-test environment vars
    restoreTest = () => {};

    restore = mockedEnv({
      GITHUB_WORKFLOW: "Reviewed-by Trailer",
      GITHUB_ACTION: "Reviewed-by Trailer Action",
      GITHUB_ACTOR: "mheap",
      GITHUB_WORKSPACE: "/tmp",
      GITHUB_SHA: "fake-sha-abc-123",
      GITHUB_REPOSITORY: "mheap/test-repo-reviewed-by-trailer",
      GITHUB_EVENT_NAME: "",
      GITHUB_EVENT_PATH: "",
      INPUT_STATES: "approved",
    });
  });

  afterEach(() => {
    restore();
    restoreTest();

    if (!nock.isDone()) {
      throw new Error(
        `Not all HTTP mocks have been used:\n\n${nock.pendingMocks()}`
      );

      nock.cleanAll();
    }
  });

  it("adds the first Reviewed-by line following an empty line", async () => {
    const tools = mockEvent("pull_request_review", validRequest);
    tools.exit.success = jest.fn();

    mockUserMichael();
    mockUpdateIssue(validRequest.pull_request.body, [
      "Michael Heap &lt;mheap@example.com>",
    ]);

    await action(tools);
    expect(tools.exit.success).toHaveBeenCalledWith("Trailer added");
  });

  it("appends additional Reviewed-by entries on the next line", async () => {
    const body = `This is an example body\n\nReviewed-by: Michael Heap &lt;mheap@example.com>`;
    const tools = mockEvent("pull_request_review", {
      ...validRequest,
      review: {
        user: {
          login: "aperson",
        },
        state: "approved",
      },
      pull_request: {
        body,
        number: 27,
      },
    });
    tools.exit.success = jest.fn();

    mockUserAshley();
    mockUpdateIssue(body, ["Ashley Person &lt;a.person@example.com>"]);

    await action(tools);
    expect(tools.exit.success).toHaveBeenCalledWith("Trailer added");
  });

  it("does not add commented reviewers by default", async () => {
    const tools = mockEvent("pull_request_review", {
      ...validRequest,
      review: {
        user: {
          login: "mheap",
        },
        state: "commented",
      },
    });
    tools.exit.success = jest.fn();

    await action(tools);
    expect(tools.exit.success).toHaveBeenCalledWith(
      "No reviewer added as with.states did not contain 'commented'"
    );
  });

  it("adds commented reviewers when enabled", async () => {
    restoreTest = mockedEnv({
      INPUT_STATES: "commented",
    });

    const tools = mockEvent("pull_request_review", {
      ...validRequest,
      review: {
        user: {
          login: "mheap",
        },
        state: "commented",
      },
    });
    tools.exit.success = jest.fn();

    mockUserMichael();
    mockUpdateIssue(validRequest.pull_request.body, [
      "Michael Heap &lt;mheap@example.com>",
    ]);

    await action(tools);
    expect(tools.exit.success).toHaveBeenCalledWith("Trailer added");
  });

  it("does not add changes_requested reviewers by default", async () => {
    const tools = mockEvent("pull_request_review", {
      ...validRequest,
      review: {
        user: {
          login: "mheap",
        },
        state: "changes_requested",
      },
    });
    tools.exit.success = jest.fn();

    await action(tools);
    expect(tools.exit.success).toHaveBeenCalledWith(
      "No reviewer added as with.states did not contain 'changes_requested'"
    );
  });

  it("adds changes_requested reviewers when enabled", async () => {
    restoreTest = mockedEnv({
      INPUT_STATES: "changes_requested",
    });

    const tools = mockEvent("pull_request_review", {
      ...validRequest,
      review: {
        user: {
          login: "mheap",
        },
        state: "changes_requested",
      },
    });
    tools.exit.success = jest.fn();

    mockUserMichael();
    mockUpdateIssue(validRequest.pull_request.body, [
      "Michael Heap &lt;mheap@example.com>",
    ]);

    await action(tools);
    expect(tools.exit.success).toHaveBeenCalledWith("Trailer added");
  });

  it("handles multiple specified states (including whitespace)", async () => {
    restoreTest = mockedEnv({
      INPUT_STATES: "approved, changes_requested",
    });

    const tools = mockEvent("pull_request_review", validRequest);
    tools.exit.success = jest.fn();

    mockUserMichael();
    mockUpdateIssue(validRequest.pull_request.body, [
      "Michael Heap &lt;mheap@example.com>",
    ]);

    await action(tools);
    expect(tools.exit.success).toHaveBeenCalledWith("Trailer added");
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

function mockUserMichael() {
  nock("https://api.github.com").get("/users/mheap").reply(200, {
    name: "Michael Heap",
    email: "mheap@example.com",
  });
}

function mockUserAshley() {
  nock("https://api.github.com").get("/users/aperson").reply(200, {
    name: "Ashley Person",
    email: "a.person@example.com",
  });
}

function mockUpdateIssue(body, expectedReviews) {
  expectedReviews ||= [];

  let reviews = ``;

  if (!body.includes("Reviewed-by")) {
    reviews = `\n`;
  }

  for (let r of expectedReviews) {
    reviews += `\nReviewed-by: ${r}`;
  }

  body += reviews;

  nock("https://api.github.com")
    .patch("/repos/mheap/test-repo-reviewed-by-trailer/issues/27", {
      body,
    })
    .reply(200);
}
