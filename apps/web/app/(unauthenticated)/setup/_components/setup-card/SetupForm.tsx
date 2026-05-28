"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setupSchema, type SetupFormValues } from "./schema";
import { AdminStep } from "./AdminStep";
import { OrganizationStep } from "./OrganizationStep";
import { createAdminAccount } from "./actions";

type Step = 1 | 2;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "01 organization" },
  { id: 2, label: "02 admin" },
];

export const SetupForm = () => {
  const [step, setStep] = useState<Step>(1);
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      const result = await createAdminAccount(values);

      if (result.status === "error") {
        setError("root", { message: result.error });
      }
    });
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
          isPending={isPending}
          rootError={errors.root?.message}
        />
      )}
    </div>
  );
};
