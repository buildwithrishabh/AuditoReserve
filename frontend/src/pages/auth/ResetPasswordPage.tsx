import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../../hooks/useToast";
import { resetPassword } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { AuthCard } from "../../components/auth/AuthCard";
import { TextField, FormError, FormSuccess } from "../../components/common/FormControls";
import { staggerContainerFast, cardItem } from "../../lib/animations";

export function ResetPasswordPage() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setServerError("");
    setIsSubmitting(true);
    try {
      const response = await resetPassword(token, password);
      setMessage(response.message || "Password reset successful. You can now log in.");
      showToast("Password updated successfully!", "success");
    } catch (error) {
      const msg = getErrorMessage(error);
      setServerError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Set new password"
      subtitle="Choose a new secure password for your student account."
    >
      <motion.form
        className="form"
        variants={staggerContainerFast}
        initial="hidden"
        animate="visible"
        onSubmit={submit}
      >
        <motion.div variants={cardItem}>
          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
            disabled={!token}
          />
        </motion.div>
        
        <motion.div variants={cardItem}>
          <FormError message={!token ? "Password reset token is missing from URL." : serverError} />
        </motion.div>
        <motion.div variants={cardItem}>
          <FormSuccess message={message} />
        </motion.div>
        
        <motion.button
          className="button primary wide"
          disabled={!token || isSubmitting}
          type="submit"
          variants={cardItem}
          style={{ marginTop: "8px" }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isSubmitting ? "Updating..." : "Reset password"}
        </motion.button>
      </motion.form>
      
      {message && (
        <p className="auth-switch">
          <Link to="/login">Go to login</Link>
        </p>
      )}
    </AuthCard>
  );
}
export default ResetPasswordPage;
