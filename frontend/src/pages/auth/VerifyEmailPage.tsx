import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { verifyEmail } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { FullPageState } from "../../components/common/LoadingSkeleton";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
  });

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

  if (isLoading) {
    return (
      <FullPageState
        title="Verifying Email"
        message="Confirming your university email address credentials..."
      />
    );
  }

  if (isError) {
    return (
      <FullPageState
        title="Verification Failed"
        message={getErrorMessage(error)}
        action={<Link className="button primary" to="/login">Back to log in</Link>}
        showSpinner={false}
      />
    );
  }

  return (
    <FullPageState
      title="Email Verified"
      message={data?.message || "Your account has been verified! You can now log in."}
      action={<Link className="button primary" to="/login">Log in now</Link>}
      showSpinner={false}
    />
  );
}
export default VerifyEmailPage;
