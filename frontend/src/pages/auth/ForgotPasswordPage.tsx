import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../../hooks/useToast";
import { forgotPassword } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { AuthCard } from "../../components/auth/AuthCard";
import { TextField, FormError, FormSuccess } from "../../components/common/FormControls";
import { staggerContainerFast, cardItem } from "../../lib/animations";

export function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setServerError("");
    setIsSubmitting(true);
    try {
      const response = await forgotPassword(email);
      const msg = response.message || "Password reset instructions sent to your email.";
      setMessage(msg);
      showToast("Reset email sent!", "success");
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
      title="Reset password"
      subtitle="We will send reset instructions to your university email address."
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
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="yourname@tmu.ac.in"
          />
        </motion.div>
        
        <motion.div variants={cardItem}>
          <FormError message={serverError} />
        </motion.div>
        <motion.div variants={cardItem}>
          <FormSuccess message={message} />
        </motion.div>
        
        <motion.button
          className="button primary wide"
          disabled={isSubmitting}
          type="submit"
          variants={cardItem}
          style={{ marginTop: "8px" }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isSubmitting ? "Sending..." : "Send reset email"}
        </motion.button>
      </motion.form>
      
      <p className="auth-switch">
        Back to <Link to="/login">Login</Link>
      </p>
    </AuthCard>
  );
}
export default ForgotPasswordPage;
