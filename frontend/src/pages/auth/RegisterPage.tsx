import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { register as registerUser } from "../../api/auth";
import { getErrorMessage } from "../../api/client";
import { AuthCard } from "../../components/auth/AuthCard";
import { TextField, FormError } from "../../components/common/FormControls";
import { staggerContainerFast, cardItem } from "../../lib/animations";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const domain = import.meta.env.VITE_UNIVERSITY_DOMAIN as string | undefined;

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError("");

    if (domain && !values.email.endsWith(`@${domain}`)) {
      setError("email", {
        message: `Only university emails ending in @${domain} are allowed`,
      });
      return;
    }

    try {
      await registerUser(values);
      showToast("Account created! Check your email to verify.", "success");
      navigate(`/login?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      const msg = getErrorMessage(error);
      setServerError(msg);
      showToast(msg, "error");
    }
  }

  return (
    <AuthCard
      title="Create student account"
      subtitle="Use your university email address. Verification is required before logging in."
    >
      <motion.form
        className="form"
        variants={staggerContainerFast}
        initial="hidden"
        animate="visible"
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      >
        <motion.div variants={cardItem}>
          <TextField
            label="Full Name"
            type="text"
            error={errors.name?.message}
            {...field("name")}
            placeholder="John Doe"
          />
        </motion.div>
        <motion.div variants={cardItem}>
          <TextField
            label="University Email"
            type="email"
            error={errors.email?.message}
            {...field("email")}
            placeholder={domain ? `student@${domain}` : "yourname@university.edu"}
          />
        </motion.div>
        <motion.div variants={cardItem} style={{ position: "relative" }}>
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            error={errors.password?.message}
            {...field("password")}
            placeholder="At least 6 characters"
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
        
        <motion.div variants={cardItem}>
          <FormError message={serverError} />
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
          {isSubmitting ? "Creating account..." : "Register"}
        </motion.button>
      </motion.form>
      
      <p className="auth-switch">
        Already registered? <Link to="/login">Log in here</Link>
      </p>
    </AuthCard>
  );
}
export default RegisterPage;
