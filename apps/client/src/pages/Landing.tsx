import { Link } from "react-router-dom";
import PublicNavbar from "@/components/PublicNavbar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, LayoutDashboard, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Search,
    iconBg: "bg-primary/10 text-primary",
    title: "Smart Discovery",
    description: "Search and filter hundreds of pre-vetted candidates by role, region, skills, rate, and availability. Find your perfect match in minutes.",
  },
  {
    icon: LayoutDashboard,
    iconBg: "bg-success/10 text-success",
    title: "Pipeline Management",
    description: "Track every candidate from discovery to hire with an intuitive drag-and-drop pipeline. Add notes, schedule interviews, and never lose track.",
  },
  {
    icon: ShieldCheck,
    iconBg: "bg-[hsl(270,60%,50%)]/10 text-[hsl(270,60%,50%)]",
    title: "Hire with Confidence",
    description: "Every candidate is pre-vetted for English fluency, technical skills, and professional experience. Review detailed profiles before you commit.",
  },
];

const steps = [
  { num: "1", title: "Search & Filter", desc: "Browse our talent pool using powerful filters to find candidates that match your exact requirements." },
  { num: "2", title: "Evaluate & Shortlist", desc: "Review detailed profiles, compare candidates, and build your shortlist with one click." },
  { num: "3", title: "Hire & Onboard", desc: "Move candidates through your pipeline, conduct interviews, and hire your perfect remote team member." },
];

const logos = ["Acme Corp", "TechFlow", "ScaleUp", "GrowthCo", "NovaTech", "PeakHR"];

const Landing = () => {
  return (
    <div className="min-h-screen bg-card">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-card py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
            🚀 Now in Beta
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
            Discover & Hire Top Remote Talent, Faster
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Search a curated pool of pre-vetted virtual assistants from Latin America, Philippines, South Africa, and Egypt. Build your remote team with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button size="lg" asChild className="px-6 py-3 text-base">
              <Link to="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="px-6 py-3 text-base">
              <Link to="/talent" className="flex items-center gap-2">
                Browse Talent Pool <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">No credit card required • Free to browse</p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-card border-t border-border pt-12 pb-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium mb-8">
            Trusted by growing teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {logos.map((name) => (
              <div key={name} className="flex items-center justify-center w-24 h-8 rounded bg-muted text-muted-foreground text-xs font-medium">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground">Everything you need to hire remotely</h2>
          <p className="text-muted-foreground mt-3">
            From discovery to hire, RemoteLeverage streamlines your entire remote hiring workflow.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {features.map((f) => (
              <div key={f.title} className="bg-card rounded-xl border border-border p-6 text-left hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center justify-center rounded-xl p-3 ${f.iconBg}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground mt-4">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-card py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 relative">
            {steps.map((s, i) => (
              <div key={s.num} className="flex flex-col items-center text-center relative">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-4">
                  {s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+30px)] w-[calc(100%-60px)] border-t-2 border-dashed border-border" />
                )}
                <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-0 pb-20">
        <div className="bg-primary text-primary-foreground py-16 rounded-2xl max-w-5xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold">Ready to build your remote team?</h2>
          <p className="mt-3 text-primary-foreground/80">Join hundreds of companies hiring smarter with RemoteLeverage.</p>
          <Button size="lg" variant="secondary" asChild className="mt-8 px-6 py-3 text-base">
            <Link to="/register">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-lg font-bold text-primary">Remote</span>
            <span className="text-lg font-bold text-foreground">Leverage</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 RemoteLeverage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
