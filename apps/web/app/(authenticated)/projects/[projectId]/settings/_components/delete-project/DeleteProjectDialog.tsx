"use client";

import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { type ProjectDto } from "@ovr/api/contracts/projects";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ovr/ui/components/alert-dialog";
import { Button } from "@ovr/ui/components/button";
import { Field, FieldError, FieldLabel } from "@ovr/ui/components/field";
import { Input } from "@ovr/ui/components/input";

import { serverClient } from "@/lib/router";

type DeleteProjectDialogProps = {
  project: ProjectDto;
};

export const DeleteProjectDialog = ({ project }: DeleteProjectDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<{ message: string } | null>(null);

  const { execute, status } = useServerAction(serverClient.projects.deleteProject, {
    interceptors: [
      onSuccess(() => router.push("/projects")),
      onError((err) => setError({ message: err.message })),
    ],
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setError(null);
      setConfirmName("");
    }
    setOpen(nextOpen);
  };

  const isDeleting = status === "pending";
  const canDelete = confirmName === project.name && !isDeleting;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger render={<Button variant="outline" color="red" size="md" />}>
        delete project…
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>delete {project.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            this will permanently delete this project and everything stored under it. this cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="confirm-project-name">type {project.name} to confirm</FieldLabel>
          <Input
            id="confirm-project-name"
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </Field>
        <FieldError errors={[error]} />
        <AlertDialogFooter>
          <AlertDialogCancel>keep project</AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            color="red"
            disabled={!canDelete}
            onClick={() => execute({ id: project.id })}
          >
            {isDeleting ? "deleting…" : "delete project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
