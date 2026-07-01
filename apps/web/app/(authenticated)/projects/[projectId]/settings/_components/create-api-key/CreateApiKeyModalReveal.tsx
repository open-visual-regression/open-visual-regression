import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { Button } from "@ovr/ui/components/button";
import { DialogClose, DialogFooter } from "@ovr/ui/components/dialog";

import { CodeBlock } from "@/lib/components/code-block/CodeBlock";

type CreateApiKeyModalRevealProps = {
  apiKey: string;
};

export const CreateApiKeyModalReveal = ({ apiKey }: CreateApiKeyModalRevealProps) => (
  <div className="flex flex-col gap-4">
    <Alert className="min-w-0">
      <AlertTitle>copy this key now, it will only be shown once</AlertTitle>
      <AlertDescription className="min-w-0">
        <CodeBlock code={apiKey} truncate className="mt-2" />
      </AlertDescription>
    </Alert>
    <DialogFooter>
      <DialogClose render={<Button />}>done</DialogClose>
    </DialogFooter>
  </div>
);
