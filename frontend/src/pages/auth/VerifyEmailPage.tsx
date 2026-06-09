import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { FullPageState } from "../../components/common/LoadingSkeleton";

// Module-level set to prevent duplicate verification calls across React StrictMode remounts
const initiatedVerifications = new Set<string>();

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, setState] = useState<{
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    data: { message?: string } | null;
  }>({
    isLoading: Boolean(token),
    isError: false,
    error: null,
    data: null,
  });

  // Track if this instance has already run the effect to avoid double-processing
  const effectRan = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (effectRan.current || initiatedVerifications.has(token)) {
      return;
    }

    effectRan.current = true;
    initiatedVerifications.add(token);

    verifyEmail(token)
      .then((res) => {
        setState({
          isLoading: false,
          isError: false,
          error: null,
          data: res,
        });
      })
      .catch((err) => {
        setState({
          isLoading: false,
          isError: true,
          error: err,
          data: null,
        });
      });
  }, [token]);

  if (!token) {
    return (
      <FullPageState
        title="Invalid Verification Link"
        message="The verification token is missing from the url parameters."
        action={<Link className="button primary" to="/login">Back to log in</Link>}
        showSpinner={false}
      />
    );
  }

  if (state.isLoading) {
    return (
      <FullPageState
        title="Verifying Email"
        message="Confirming your university email address credentials..."
      />
    );
  }

  if (state.isError) {
    return (
      <FullPageState
        title="Verification Failed"
        message={getErrorMessage(state.error)}
        action={<Link className="button primary" to="/login">Back to log in</Link>}
        showSpinner={false}
      />
    );
  }

  return (
    <FullPageState
      title="Email Verified"
      message={state.data?.message || "Your account has been verified! You can now log in."}
      action={<Link className="button primary" to="/login">Log in now</Link>}
      showSpinner={false}
    />
  );
}

export default VerifyEmailPage;

