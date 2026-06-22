import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { YatraLogo } from "@/components/yatra-logo";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 6 characters", pass: password.length >= 6 },
    { label: "Contains a number", pass: /\d/.test(password) },
    { label: "Contains a letter", pass: /[a-zA-Z]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.pass ? "text-green-600" : "text-muted-foreground"}`}>
          <CheckCircle2 className={`w-3 h-3 ${c.pass ? "text-green-600" : "text-muted-foreground/40"}`} />
          {c.label}
        </div>
      ))}
    </div>
  );
}

export default function Signup() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      setLocation("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-card border rounded-3xl shadow-xl p-8 md:p-10">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="text-primary mb-4">
              <YatraLogo size={52} />
            </div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Travel Nepal safely, together</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="signup-username">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="signup-username"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. priya_travels"
                  className="pl-10 h-12 rounded-xl"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="signup-email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-10 h-12 rounded-xl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="signup-password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="pl-10 pr-10 h-12 rounded-xl"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 rounded-xl text-base font-semibold mt-2"
              disabled={loading || !username || !email || !password}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create account
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>

        </div>

        {/* Back link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← Back to Yatra
          </Link>
        </p>
      </div>
    </div>
  );
}
