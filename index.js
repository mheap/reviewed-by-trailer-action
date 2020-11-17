const { Toolkit } = require("actions-toolkit");

// Run your GitHub Action!
Toolkit.run(
  async (tools) => {
    // Append if it passed

    // Append if it failed + feature is enabled

    // Append if neutral + feature is enabled
    tools.exit.success("We did it!");
  },
  {
    event: "pull_request_review",
  }
);
