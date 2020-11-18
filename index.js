const { Toolkit } = require("actions-toolkit");

// Run your GitHub Action!
Toolkit.run(
  async (tools) => {
    const allowedStates = tools.inputs.states.split(",").map((s) => s.trim());
    const state = tools.context.payload.review.state;

    if (!allowedStates.includes(state)) {
      return tools.exit.success(
        `No reviewer added as with.states did not contain '${state}'`
      );
    }

    let body = tools.context.payload.pull_request.body;

    // Fetch the user
    const username = tools.context.payload.review.user.login;
    const { data: user } = await tools.github.users.getByUsername({
      username,
    });

    // Make sure there is an additional blank line if there is no reviewed by trailer
    if (!body.includes("Reviewed-by")) {
      body += "\n";
    }

    // Append if it passed
    body += `\nReviewed-by: ${user.name} &lt;${user.email}>`;

    await tools.github.issues.update({
      ...tools.context.issue,
      body,
    });

    tools.exit.success("Trailer added");
  },
  {
    event: "pull_request_review",
  }
);
