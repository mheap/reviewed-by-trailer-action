# reviewed-by-trailer-action

This GitHub Action will automatically append a `Reviewed-by:` trailer to the body of a `pull_request` when a review is completed. This can then be used with `git shortlog -ns --group=trailer:reviewed-by` to see who is reviewing the most pull requests.

To use this action, you must always `Squash and Merge` pull requests, using the body of the PR as the commit message for the squashed commit.

## Usage

Create the following file at `.github/workflows/pull_request_review-trailer.yml`:

```yaml
name: PR Review
on: pull_request_review
jobs:
  review:
    name: Reviewed-by Trailer
    runs-on: ubuntu-latest
    steps:
      - name: Debug
        uses: mheap/reviewed-by-trailer-action@v1
        with:
          states: approved,changed_requested
```

## Configuration

This action accepts a comma-separated `states` input to control which events trigger `Reviewed-by` to be added. The available states are:

- `approved`
- `changes_requested`
- `commented`

The default value for this field is `approved`, which means that only approving reviews will be added. The example above enables the action for both `approved` and `changes_requested`
