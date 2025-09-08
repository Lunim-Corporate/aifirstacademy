import { useEffect, useState } from "react";
import SafeLink from "@/components/SafeLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BrainCircuit, Check } from "lucide-react";
import { apiCheckoutStart, apiPricing } from "@/lib/api";
import type { PricingResponse } from "@shared/api";
import MarketingFooter from "@/components/MarketingFooter";

export default function Pricing() {
  const [data, setData] = useState<PricingResponse | null>(null);
  const [email, setEmail] = useState("");
  useEffect(() => { apiPricing().then(setData).catch(()=>setData(null)); }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <SafeLink to="/" className="flex items-center">
                <BrainCircuit className="h-8 w-8 text-brand-600" />
                <span className="ml-2 text-xl font-bold gradient-text">AI-First Academy</span>
              </SafeLink>
              <div className="hidden md:ml-10 md:flex space-x-8">
                <SafeLink to="/product" className="text-muted-foreground hover:text-foreground">Product</SafeLink>
                <SafeLink to="/pricing" className="text-foreground">Pricing</SafeLink>
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

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
            <p className="text-lg text-muted-foreground">Start free, scale as you grow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {(data?.plans || []).map((p) => (
              <Card key={p.id} className={p.id === "pro" ? "border-brand-200 bg-brand-50/50 relative" : "border-border/50"}>
                {p.id === "pro" && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600">Most Popular</Badge>}
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>{p.interval === "custom" ? "For teams and organizations" : `Billed per ${p.interval}`}</CardDescription>
                  <div className="text-3xl font-bold">{p.price === null ? "Custom" : `$${p.price}`}{p.price !== null && <span className="text-lg font-normal text-muted-foreground">/month</span>}</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center"><Check className="h-4 w-4 text-success mr-2" />{f}</li>
                    ))}
                  </ul>
                  {p.cta.action === "signup" && (
                    <Button asChild variant="outline" className="w-full"><SafeLink to="/signup">{p.cta.label}</SafeLink></Button>
                  )}
                  {p.cta.action === "checkout" && (
                    <div className="space-y-2">
                      <Input placeholder="Email to start trial" value={email} onChange={(e)=>setEmail(e.target.value)} />
                      <Button className="w-full" disabled={!email.trim()} onClick={async()=>{ const res = await apiCheckoutStart({ planId: p.id, email: email.trim() }); window.location.href = res.url; }}>{p.cta.label}</Button>
                    </div>
                  )}
                  {p.cta.action === "contact" && (
                    <Button asChild variant="outline" className="w-full"><SafeLink to="/teams#contact">{p.cta.label}</SafeLink></Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {Boolean(data?.comparison?.length) && (
        <section className="py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="overflow-x-auto">
              <CardHeader><CardTitle>Compare plans</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2">Feature</th>
                      {(data?.plans||[]).map(p=> (
                        <th key={p.id} className="text-left py-2">{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.comparison||[]).map((row)=> (
                      <tr key={row.key} className="border-t border-border/40">
                        <td className="py-2 pr-4 text-muted-foreground">{row.label}</td>
                        {(data?.plans||[]).map(p=> {
                          const v = row.availability[p.id];
                          return (
                            <td key={p.id} className="py-2">
                              {v === true && <span className="text-success">Included</span>}
                              {v === false && <span className="text-destructive">—</span>}
                              {v === 'limited' && <span className="text-warning">Limited</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </section>
      )}


      <MarketingFooter />
    </div>
  );
}
