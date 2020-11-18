const { Toolkit } = require("actions-toolkit");

// Run your GitHub Action!
Toolkit.run(
  async (tools) => {
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

    tools.github.issues.update({
      ...tools.context.issue,
      body,
    });

    // Append if it failed + feature is enabled
    // @TODO

    // Append if neutral + feature is enabled
    // @TODO
    tools.exit.success("We did it!");
  },
  {
    event: "pull_request_review",
  }
);
