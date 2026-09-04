import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import ResetPasswordForm from "./reset-password-form";

// useSearchParams() in ResetPasswordForm opts the route into client-side
// rendering up to the nearest Suspense boundary during prerendering —
// wrapping it here lets everything else on the route still prerender.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
