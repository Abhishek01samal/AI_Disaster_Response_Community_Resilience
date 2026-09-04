import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

// useSearchParams() in ResetPasswordForm (reading the ?email= prefill)
// requires a Suspense boundary for this route to prerender cleanly.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
