import { Alert, AlertDescription, AlertTitle } from "@ovr/ui/components/alert";
import { Button } from "@ovr/ui/components/button";
import { DialogClose, DialogFooter } from "@ovr/ui/components/dialog";
import { CodeBlock } from "@/lib/components/code-block/CodeBlock";

type InviteUserModalRevealProps = {
  invitationUrl: string;
};

export const InviteUserModalReveal = ({ invitationUrl }: InviteUserModalRevealProps) => (
  <div className="flex flex-col gap-4">
    <Alert variant="success" className="min-w-0">
      <AlertTitle>share this link with the user so they can accept the invitation.</AlertTitle>
      <AlertDescription className="min-w-0">
        <CodeBlock code={invitationUrl} truncate className="mt-2" />
      </AlertDescription>
    </Alert>
    <DialogFooter>
      <DialogClose render={<Button />}>done</DialogClose>
    </DialogFooter>
  </div>
);
