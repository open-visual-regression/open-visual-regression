"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onError, onSuccess } from "@orpc/client";
import { useServerAction } from "@orpc/react/hooks";
import { setupSchema, type SetupFormValues } from "./schema";
import { AdminStep } from "./AdminStep";
import { OrganizationStep } from "./OrganizationStep";
import { router } from "@/lib/router";

type Step = 1 | 2;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "01 organization" },
  { id: 2, label: "02 admin" },
];

export const SetupForm = () => {
  const [step, setStep] = useState<Step>(1);
  const navigate = useRouter();

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      organizationName: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { execute, status } = useServerAction(router.setup.exec, {
    interceptors: [
      onSuccess(() => navigate.push("/projects")),
      onError((err) => setError("root", { message: err.message })),
    ],
  });

  const handleStep1Submit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const valid = await trigger("organizationName");

    if (valid) {
      clearErrors(["name", "email", "password", "confirmPassword"]);
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleFormSubmit = (values: SetupFormValues) => {
    execute(values);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 text-badge tracking-label uppercase">
        {STEPS.map(({ id, label }) => (
          <span key={id} className={step === id ? "text-ovr-accent" : "text-ovr-fg-muted"}>
            {label}
          </span>
        ))}
        <span className="ml-auto text-ovr-fg-muted">step {step} of 2</span>
      </div>

      {step === 1 ? (
        <OrganizationStep register={register} errors={errors} onSubmit={handleStep1Submit} />
      ) : (
        <AdminStep
          register={register}
          errors={errors}
          onSubmit={handleSubmit(handleFormSubmit)}
          onBack={handleBack}
          isPending={status === "pending"}
          rootError={errors.root?.message}
        />
      )}
    </div>
  );
};
