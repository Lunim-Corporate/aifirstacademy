import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SafeLink from "@/components/SafeLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, ArrowRight, Check, ShieldCheck, BarChart3, Users as UsersIcon, Sparkles, Layers, Wrench, Gauge, Lock, Rocket } from "lucide-react";
import { apiMarketingProduct } from "@/lib/api";
import type { MarketingProductResponse } from "@shared/api";
import MarketingFooter from "@/components/MarketingFooter";

export default function Product() {
  const [data, setData] = useState<MarketingProductResponse | null>(null);
  const navigate = useNavigate();
  useEffect(() => { apiMarketingProduct().then(setData).catch(()=>setData(null)); }, []);

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
                <SafeLink to="/product" className="text-foreground">Product</SafeLink>
                <SafeLink to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</SafeLink>
                <SafeLink to="/teams" className="text-muted-foreground hover:text-foreground">For Teams</SafeLink>
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

      <section className="py-20 bg-gradient-to-br from-background via-primary-50/30 to-brand-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="bg-brand-50 text-brand-700">Product</Badge>
              <h1 className="text-4xl lg:text-6xl font-bold">{data?.hero.title || "AI Workflow Training that Delivers"}</h1>
              <p className="text-xl text-muted-foreground max-w-2xl">{data?.hero.subtitle || "Learn, practice, and certify practical AI skills with live feedback and enterprise-ready features."}</p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={()=>navigate("/signup")}>Start Free <ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button size="lg" variant="outline" onClick={()=>navigate("/dashboard")}>Try Sandbox</Button>
              </div>
              {Boolean(data?.logos?.length) && (
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground pt-2">
                  <span className="text-xs uppercase tracking-widest">Trusted by</span>
                  {(data?.logos||[]).map((l)=> (
                    <span key={l} className="text-sm font-medium opacity-70">{l}</span>
                  ))}
                </div>
              )}
            </div>
            <Card className="border-gray-200 dark:border-gray-700/50 bg-background/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Why AI-First Academy</CardTitle>
                <CardDescription>Built for practical outcomes</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                {(data?.features || []).map(f => (
                  <div key={f.id} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-1" />
                    <div>
                      <div className="font-medium">{f.title}</div>
                      <div className="text-sm text-muted-foreground">{f.description}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {Boolean(data?.integrations?.length) && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">Integrations</h2>
            <div className="flex flex-wrap gap-2">
              {(data?.integrations||[]).map((name)=> (
                <span key={name} className="px-3 py-1 rounded-full bg-muted text-sm">{name}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {Boolean(data?.caseStudies?.length) && (
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Customer Results</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {data?.caseStudies?.map(cs => (
                <Card key={cs.id} className="border-gray-200 dark:border-gray-700/50">
                  <CardHeader>
                    <CardTitle>{cs.title}</CardTitle>
                    <CardDescription>{cs.company} • {cs.metric}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">{cs.summary}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">What customers say</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {(data?.testimonials || []).map(t => (
              <Card key={t.id} className="border-gray-200 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">“{t.quote}”</p>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          {[{icon:Sparkles,title:'Learn by Doing',desc:'Short, focused modules with live LLM feedback. Practice real-world workflows and see your score improve.'},{icon:Layers,title:'Battle‑tested Patterns',desc:'Prompt structures and templates used by high‑performing teams. Copy, adapt, and standardize.'},{icon:BarChart3,title:'Measure Outcomes',desc:'Admin analytics, cohort progress, and certificates that prove skill improvement.'}].map(({icon:Icon,title,desc},i)=> (
            <Card key={i} className="border-gray-200 dark:border-gray-700/50">
              <CardHeader>
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-3"><Icon className="h-5 w-5"/></div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Use cases by role */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-10">Where we make you faster</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[{t:'Engineers',b:['PR summaries','Test generation','Code review prompts','Spec drafting']},{t:'Marketers',b:['Campaign briefs','Ad variants','SEO outlines','Customer research']},{t:'Designers',b:['Research synthesis','UX copy','Design critiques','Hand‑off notes']},{t:'Data Teams',b:['SQL drafting','RAG prompts','Eval harnesses','Report narratives']}].map((role,i)=> (
              <Card key={role.t} className="border-gray-200 dark:border-gray-700/50">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2">{role.t}</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                    {role.b.map(x=> (<li key={x}>{x}</li>))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature deep dives */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-10">Everything you need to operationalize AI</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[{i:Wrench,t:'Prompt Sandbox',d:'Iterate with real models, compare outputs, and get instant scoring with actionable tips.'},{i:Gauge,t:'Evaluations',d:'Tiny eval harnesses to prevent regressions. Track accuracy, latency, and cost.'},{i:UsersIcon,t:'Team Cohorts',d:'Onboard by role, assign tracks, and track progress with completion targets.'},{i:Lock,t:'Security',d:'SSO, SCIM, RBAC, and audit logs. Enterprise data retention controls.'},{i:Layers,t:'Templates & Library',d:'Curated prompts and templates for repeatable outcomes. Keep private or share.'},{i:Rocket,t:'Certificates',d:'Verify skills with assessments and earn shareable certificates.'}].map((f,idx)=> (
              <Card key={idx} className="border-gray-200 dark:border-gray-700/50">
                <CardHeader>
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-3"><f.i className="h-5 w-5"/></div>
                  <CardTitle>{f.t}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">{f.d}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6 text-center">
          {[{k:'+43%',l:'Faster AI feature delivery'},{k:'-58%',l:'Marketing brief turnaround'},{k:'95%',l:'Learners show measured improvement'}].map((s)=> (
            <Card key={s.k} className="border-gray-200 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-4xl">{s.k}</CardTitle>
                <CardDescription>{s.l}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-6 items-start">
          <div>
            <h2 className="text-3xl font-bold mb-4">Enterprise‑grade security</h2>
            <p className="text-muted-foreground">We follow best practices for data protection. Enterprise plans include SSO, SCIM, RBAC, audit logs, and configurable retention.</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              {['SSO & SCIM','Role‑based access control','Exportable audit logs','Data retention controls'].map(x=> (<li key={x}>{x}</li>))}
            </ul>
          </div>
          <Card className="border-gray-200 dark:border-gray-700/50">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5"/> Controls</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">Granular org policies ensure the right people have the right access at the right time.</CardContent>
          </Card>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8">Why teams choose us</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2">Feature</th>
                  <th className="text-left py-2">AI-First Academy</th>
                  <th className="text-left py-2">General courses</th>
                  <th className="text-left py-2">One-off prompts</th>
                </tr>
              </thead>
              <tbody>
                {[{f:'Live model feedback',us:'Yes',c:'No',p:'No'},{f:'Eval harnesses',us:'Built-in',c:'No',p:'No'},{f:'Team cohorts',us:'Yes',c:'Limited',p:'No'},{f:'Admin analytics',us:'Yes',c:'Limited',p:'No'},{f:'Certificates',us:'Verifiable',c:'Sometimes',p:'No'}].map(row=> (
                  <tr key={row.f} className="border-t border-gray-200 dark:border-gray-700/40">
                    <td className="py-2 pr-4 text-muted-foreground">{row.f}</td>
                    <td className="py-2">{row.us}</td>
                    <td className="py-2">{row.c}</td>
                    <td className="py-2">{row.p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-brand-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to upskill your team?</h2>
          <p className="text-primary-100 mb-6">Start free today, or request a live demo for your organization.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="secondary" className="bg-white text-primary-600 hover:bg-gray-100"><SafeLink to="/signup">Start Free</SafeLink></Button>
            <Button asChild variant="outline" className="border-white text-white hover:bg-white/10"><SafeLink to="/teams#contact">Request Demo</SafeLink></Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

