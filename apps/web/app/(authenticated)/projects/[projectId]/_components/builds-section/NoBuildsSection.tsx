import { Card, CardContent, CardHeader } from "@ovr/ui/components/card";
import { Typography } from "@ovr/ui/components/typography";
import { CodeBlock } from "@/lib/components/code-block/CodeBlock";

const SAMPLE_COMMAND = `OVR_API_KEY=<your-api-key> ovr snapshot storybook \\
  --dir ./storybook-static \\
  --server-url <your-ovr-server-url> \\
  --branch $(git branch --show-current) \\
  --commit $(git rev-parse HEAD) \\
  --name "$(git log -1 --pretty=%s)" \\
  --author "$(git log -1 --pretty=%an)"`;

export const NoBuildsSection = () => (
  <Card className="bg-pixel-grid py-20">
    <CardHeader className="flex justify-center">
      <Typography variant="h2" as="h2">
        no builds yet
      </Typography>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center gap-6">
      <Typography variant="caption" className="text-sm">
        builds appear here once you run the ovr cli to upload snapshots for this project.
      </Typography>
      <CodeBlock code={SAMPLE_COMMAND} className="w-full max-w-lg" />
    </CardContent>
  </Card>
);
