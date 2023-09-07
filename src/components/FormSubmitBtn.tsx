"use client";

import { ComponentProps } from "react";
import { experimental_useFormStatus as useFormStatus } from "react-dom";

type FormSubmitBtnProps = {
  children: React.ReactNode;
  className?: string;
} & ComponentProps<"button">;

export default function FormSubmitBtn({
  children,
  className,
  ...props
}: FormSubmitBtnProps) {
  const { pending } = useFormStatus();
  console.log(pending);

  return (
    <button
      {...props}
      className={`btn-primary btn ${className}`}
      type="submit"
      disabled={pending}
    >
      {pending && <span className="loading loading-spinner"></span>}
      {children}
    </button>
  );
}
