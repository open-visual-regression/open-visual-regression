# @ovr/capture-browser

Drives a browser to capture an uploaded build: serving it, booting it in a page,
waiting for a target to render and settle, and taking the screenshot. What is
specific to a kind of build (such as Storybook) lives in its capture strategy.
Shared by the worker and the CLI so local captures match real builds.
