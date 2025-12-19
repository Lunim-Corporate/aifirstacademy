import { useState } from "react";
import SafeLink from "@/components/SafeLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, ShieldCheck, BarChart3, Users2, CheckCircle2 } from "lucide-react";
import { apiTeamInquiry } from "@/lib/api";
import MarketingFooter from "@/components/MarketingFooter";

export default function Teams() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-gray-200 dark:border-gray-700/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <SafeLink to="/" className="flex items-center">
                <BrainCircuit className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold" style={{color: 'white'}}>AI-First Marketing Academy</span>
              </SafeLink>
              <div className="hidden md:ml-10 md:flex space-x-8">
                <SafeLink to="/product" className="text-muted-foreground hover:text-foreground">Product</SafeLink>
                <SafeLink to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</SafeLink>
                <SafeLink to="/teams" className="text-foreground">For Teams</SafeLink>
                <SafeLink to="/resources" className="text-muted-foreground hover:text-foreground">Resources</SafeLink>
                <SafeLink to="/faq" className="text-muted-foreground hover:text-foreground">FAQ</SafeLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild><SafeLink to="/login">Login</SafeLink></Button>
              <Button asChild><SafeLink to="/signup">Start Free Trial</SafeLink></Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-bold">AI Upskilling for Teams</h1>
            <p className="text-lg text-muted-foreground">Onboard cohorts, assign tracks, track progress, and certify outcomes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[{ icon: Users2, title: 'Cohort onboarding', desc: 'Spin up cohorts and assign tracks by role.' }, { icon: BarChart3, title: 'Progress analytics', desc: 'Measure adoption and skill improvement.' }, { icon: ShieldCheck, title: 'Enterprise ready', desc: 'SSO, SCIM, and admin controls.' }].map(({icon:Icon,title,desc},i)=> (
              <Card key={i} className="border-gray-200 dark:border-gray-700/50">
                <CardHeader>
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-3"><Icon className="h-5 w-5"/></div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">{desc}</CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <Card>
              <CardHeader><CardTitle>Request a Demo</CardTitle><CardDescription>Tell us about your team</CardDescription></CardHeader>
              <CardContent className="space-y-3" id="contact">
                <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={e=>setName(e.target.value)} /></div>
                <div className="space-y-1"><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
                <div className="space-y-1"><Label>Company</Label><Input value={company} onChange={e=>setCompany(e.target.value)} /></div>
                <div className="space-y-1"><Label>Team Size</Label><Input value={teamSize} onChange={e=>setTeamSize(e.target.value)} placeholder="e.g. 25" /></div>
                <div className="space-y-1"><Label>Message</Label><Textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Your goals, timeline, and questions" /></div>
                <Button disabled={submitting || !name || !email} onClick={async()=>{
                  setSubmitting(true);
                  try { await apiTeamInquiry({ name, email, company, teamSize, message }); setSuccess(true); setName(""); setEmail(""); setCompany(""); setTeamSize(""); setMessage(""); }
                  catch(e:any){ alert(e?.message||"Failed to submit"); }
                  finally{ setSubmitting(false); }
                }}>{submitting?"Submitting...":"Submit"}</Button>
                {success && <div className="text-sm text-success">Thanks! We'll reach out shortly.</div>}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-gray-200 dark:border-gray-700/50">
                <CardHeader><CardTitle>Benefits</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {['Role-based tracks and certificates','Private library for team assets','Weekly challenges to reinforce learning','Templates for real-world workflows'].map((b)=> (
                      <li key={b} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5"/><span>{b}</span></li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-gray-200 dark:border-gray-700/50">
                <CardHeader><CardTitle>Security & Compliance</CardTitle><CardDescription>Enterprise controls</CardDescription></CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {['SSO & SCIM','Role-based access control','Exportable audit logs','Data retention controls'].map((b)=> (
                      <li key={b} className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-0.5"/><span>{b}</span></li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

