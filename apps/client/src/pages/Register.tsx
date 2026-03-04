import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [size, setSize] = useState("");
  const [revenue, setRevenue] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !email || !password || !confirm || !size || !revenue) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await register({
        name: company,
        email,
        password,
        size,
        monthlyRevenue: revenue,
      });
      // Navigation handled by AuthContext
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="bg-card rounded-2xl shadow-lg p-8 w-full max-w-md border border-border">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-0 mb-4">
            <span className="text-xl font-bold text-primary">Remote</span>
            <span className="text-xl font-bold text-foreground">Leverage</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start discovering top remote talent</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company name</Label>
            <Input id="company" placeholder="Your Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPw ? "text" : "password"} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" type="password" placeholder="Confirm your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Company size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger><SelectValue placeholder="Select company size" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Just me</SelectItem>
                <SelectItem value="2-10">2-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="200+">200+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Company Monthly Revenue</Label>
            <Select value={revenue} onValueChange={setRevenue}>
              <SelectTrigger><SelectValue placeholder="Select revenue range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0-5k">$0 — $5k / month</SelectItem>
                <SelectItem value="5k-10k">$5k — $10k / month</SelectItem>
                <SelectItem value="10k-50k">$10k — $50k / month</SelectItem>
                <SelectItem value="50k-100k">$50k — $100k / month</SelectItem>
                <SelectItem value="100k+">$100k+ / month</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This helps us tailor recommendations to your business</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
        <p className="text-sm text-center text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
