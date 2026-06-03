import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield,
  ShieldAlert,
  Zap,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { signInWithUsername, signUpWithUsername } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/dashboard";

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!loginData.username.trim()) errs.loginUser = "Username is required";
    if (!loginData.password) errs.loginPass = "Password is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await signInWithUsername(
      loginData.username.trim(),
      loginData.password,
    );
    setLoading(false);
    if (error) {
      toast.error("Login failed", {
        description: "Invalid username or password",
      });
    } else {
      toast.success("Welcome back, Commander");
      navigate(from, { replace: true });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!registerData.username.trim()) errs.regUser = "Username is required";
    else if (!/^[a-zA-Z0-9_]+$/.test(registerData.username))
      errs.regUser = "Only letters, digits, and _ allowed";
    if (!registerData.password || registerData.password.length < 8)
      errs.regPass = "Password must be at least 8 characters";
    if (registerData.password !== registerData.confirmPassword)
      errs.regConfirm = "Passwords do not match";
    if (!agreed) errs.agreed = "You must agree to the User Agreement";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await signUpWithUsername(
      registerData.username.trim(),
      registerData.password,
    );
    setLoading(false);
    if (error) {
      toast.error("Registration failed", { description: error.message });
    } else {
      toast.success("Account created — SafeSakhi AI is ready");
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glowing orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5 blur-3xl"
        style={{ background: "hsl(var(--neon-pink))" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5 blur-3xl"
        style={{ background: "hsl(var(--neon-purple))" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm border border-primary/30 bg-primary/10 mb-4 relative">
            <ShieldAlert className="w-8 h-8 text-primary" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-safe animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold gradient-text font-mono tracking-wider">
            SAFESAKHI AI
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Autonomous Women's Safety Command Center
          </p>
        </div>

        <Card className="glass-card border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-primary" />
              Secure Access
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Authentication required to access the Command Center
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="w-full bg-muted/50 mb-6">
                <TabsTrigger value="login" className="flex-1 font-mono text-xs">
                  SIGN IN
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex-1 font-mono text-xs"
                >
                  REGISTER
                </TabsTrigger>
              </TabsList>

              {/* Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="login-user"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Username
                    </Label>
                    <Input
                      id="login-user"
                      placeholder="commander_sakhi"
                      value={loginData.username}
                      onChange={(e) =>
                        setLoginData((p) => ({
                          ...p,
                          username: e.target.value,
                        }))
                      }
                      className="bg-muted/30 border-border font-mono text-sm px-3"
                    />
                    {errors.loginUser && (
                      <p className="text-xs text-emergency flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.loginUser}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="login-pass"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-pass"
                        type={showLoginPw ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData((p) => ({
                            ...p,
                            password: e.target.value,
                          }))
                        }
                        className="bg-muted/30 border-border font-mono text-sm px-3 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPw((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showLoginPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.loginPass && (
                      <p className="text-xs text-emergency flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.loginPass}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-mono text-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-spin" />
                        AUTHENTICATING...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        ACCESS COMMAND CENTER
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="reg-user"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Username
                    </Label>
                    <Input
                      id="reg-user"
                      placeholder="your_username"
                      value={registerData.username}
                      onChange={(e) =>
                        setRegisterData((p) => ({
                          ...p,
                          username: e.target.value,
                        }))
                      }
                      className="bg-muted/30 border-border font-mono text-sm px-3"
                    />
                    {errors.regUser && (
                      <p className="text-xs text-emergency flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.regUser}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="reg-pass"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="reg-pass"
                        type={showRegPw ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData((p) => ({
                            ...p,
                            password: e.target.value,
                          }))
                        }
                        className="bg-muted/30 border-border font-mono text-sm px-3 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPw((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showRegPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.regPass && (
                      <p className="text-xs text-emergency flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.regPass}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="reg-confirm"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="Re-enter password"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData((p) => ({
                          ...p,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="bg-muted/30 border-border font-mono text-sm px-3"
                    />
                    {errors.regConfirm && (
                      <p className="text-xs text-emergency flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.regConfirm}
                      </p>
                    )}
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="agree"
                      checked={agreed}
                      onCheckedChange={(v) => setAgreed(!!v)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="agree"
                      className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                    >
                      I agree to the{" "}
                      <span className="text-primary underline cursor-pointer">
                        User Agreement
                      </span>{" "}
                      and{" "}
                      <span className="text-primary underline cursor-pointer">
                        Privacy Policy
                      </span>
                      . Your safety data is encrypted and never shared without
                      your consent.
                    </label>
                  </div>
                  {errors.agreed && (
                    <p className="text-xs text-emergency flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.agreed}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full font-mono text-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-spin" />
                        CREATING ACCOUNT...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        CREATE ACCOUNT
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Demo access note */}
            <div className="mt-4 p-3 rounded-sm border border-warning-custom/20 bg-warning-custom/5">
              <p className="text-xs text-muted-foreground font-mono">
                <span className="text-warning-custom">DEMO MODE:</span> Use
                username <span className="text-foreground">demo</span> /
                password <span className="text-foreground">demo1234</span> for
                judging access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
