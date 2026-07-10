import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { login, resendVerification } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { AuthCard } from "../../components/auth/AuthCard";
import { TextField, FormError } from "../../components/common/FormControls";
import { staggerContainerFast, cardItem } from "../../lib/animations";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const registeredEmail = searchParams.get("email");
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register: field,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: registeredEmail || "" },
  });

  const emailVal = useWatch({ control, name: "email" });

  async function handleResend() {
    const emailToResend = emailVal || registeredEmail;
    if (!emailToResend) {
      showToast("Please enter your email address first.", "error");
      return;
    }
    setIsResending(true);
    try {
      const response = await resendVerification(emailToResend);
      showToast(response.message || "Verification email sent!", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsResending(false);
    }
  }

  async function onSubmit(values: LoginFormValues) {
    setServerError("");
    try {
      const response = await login(values);
      setUser(response.user);
      showToast(`Welcome back, ${response.user.name}!`, "success");
      navigate(response.user.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (error) {
      const msg = getErrorMessage(error);
      setServerError(msg);
      showToast(msg, "error");
    }
  }

  return (
    <AuthCard title="Log in" subtitle="Access bookings and auditorium management.">
      <motion.form
        className="form"
        variants={staggerContainerFast}
        initial="hidden"
        animate="visible"
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      >
        {registeredEmail && (
          <motion.div variants={cardItem} className="success-box" style={{ marginBottom: "4px" }}>
            <CheckCircle2 size={16} />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span>Account created! Verify your email before logging in.</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--accent)",
                  fontWeight: 700,
                  fontSize: "12px",
                  textAlign: "left",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {isResending ? "Resending..." : "Didn't receive email? Resend verification link"}
              </button>
            </div>
          </motion.div>
        )}
        <motion.div variants={cardItem}>
          <TextField
            label="University Email"
            type="email"
            error={errors.email?.message}
            {...field("email")}
            placeholder="yourname@tmu.ac.in"
          />
        </motion.div>
        <motion.div variants={cardItem} style={{ position: "relative" }}>
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            error={errors.password?.message}
            {...field("password")}
            placeholder="••••••••"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: "12px",
              bottom: errors.password?.message ? "32px" : "8px",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </motion.div>
        
        <motion.div variants={cardItem} style={{ display: "flex", justifyContent: "flex-end", marginTop: "-10px" }}>
          <Link
            to="/forgot-password"
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--accent)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            Forgot password?
          </Link>
        </motion.div>
        
        <motion.div variants={cardItem}>
          <FormError message={serverError} />
          {serverError.toLowerCase().includes("verify your email") && (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: "none",
                border: "none",
                padding: "4px 0",
                color: "var(--accent)",
                fontWeight: 700,
                fontSize: "13px",
                textAlign: "left",
                textDecoration: "underline",
                cursor: "pointer",
                marginTop: "4px",
                display: "block",
              }}
            >
              {isResending ? "Resending..." : "Resend verification link"}
            </button>
          )}
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
          {isSubmitting ? "Logging in..." : "Log in"}
        </motion.button>
      </motion.form>
      
      <p className="auth-switch">
        No account? <Link to="/register">Register here</Link>
      </p>
    </AuthCard>
  );
}
export default LoginPage;
