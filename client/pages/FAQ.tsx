import { useMemo } from "react";
import { BrainCircuit, HelpCircle, ShieldCheck, CreditCard, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MarketingFooter from "@/components/MarketingFooter";
import SafeLink from "@/components/SafeLink";
import { motion } from "framer-motion";

const categories = [
  {
    icon: Sparkles,
    title: "Product",
    items: [
      { q: "What is AI-First Academy?", a: "A hands-on platform to learn practical AI workflows with live LLM feedback, interactive challenges, templates, and certifications." },
      { q: "Which LLMs are supported?", a: "We support leading providers and update frequently. We design prompts and workflows to be model-agnostic where possible." },
      { q: "Do I need prior AI experience?", a: "No. Tracks start from fundamentals and ramp to advanced topics like evaluation, RAG, and safety." },
      { q: "Do you offer certificates?", a: "Yes. Complete assessments to earn shareable, verifiable certificates." },
    ],
  },
  {
    icon: CreditCard,
    title: "Pricing & Billing",
    items: [
      { q: "Is there a free plan?", a: "Yes. Start for free with limited runs and upgrade anytime." },
      { q: "Can I cancel anytime?", a: "Yes. Manage your subscription from settings; cancellations take effect at the end of the billing cycle." },
      { q: "Do you offer annual or volume discounts?", a: "Yes. Contact sales for annual pricing and team discounts." },
      { q: "Which payment methods are supported?", a: "All major cards. Invoices and purchase orders available for Enterprise." },
    ],
  },
  {
    icon: Users,
    title: "Teams & Admin",
    items: [
      { q: "Do you support SSO and provisioning?", a: "Enterprise supports SSO and SCIM provisioning with admin analytics and role-based access." },
      { q: "Can I create private content for my team?", a: "Yes. Teams can maintain a private library of guides, templates, and prompts." },
      { q: "How do cohorts work?", a: "Create cohorts, assign tracks by role, and monitor progress with analytics and completion reports." },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security",
    items: [
      { q: "Is our data safe?", a: "We follow best practices for data handling, with role-based access control and audit logs. Enterprise offers data retention controls." },
      { q: "Can I keep prompts and templates private?", a: "Yes. Your private library content is scoped to your org unless explicitly shared." },
      { q: "Do you store model inputs/outputs?", a: "We store minimal metadata for analytics and improvement; Enterprise can configure retention and redaction policies." },
    ],
  },
  {
    icon: HelpCircle,
    title: "Account & Support",
    items: [
      { q: "How do I reset my password?", a: "Use Forgot Password on the login page. You’ll receive an OTP to complete the reset." },
      { q: "How do I contact support?", a: "Email hello@aifirst.academy or use the in-app help. Enterprise plans include priority support and a dedicated channel." },
      { q: "Do you have refunds?", a: "Monthly subscriptions are not refundable once started, but you can cancel any time; exceptions considered case-by-case for annual plans." },
    ],
  },
  {
    icon: BrainCircuit,
    title: "Legal",
    items: [
      { q: "Where can I find your Terms and Privacy Policy?", a: "See the links in the footer. Enterprise agreements can include DPAs and custom terms." },
      { q: "Do you comply with data regulations?", a: "We design for compliance with common regulations. For specific needs, contact sales." },
    ],
  },
];

export default function FAQ() {
  const flat = useMemo(() => categories.flatMap(c => c.items.map(i => ({ ...i, cat: c.title }))), []);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <SafeLink to="/teams" className="text-muted-foreground hover:text-foreground">For Teams</SafeLink>
                <SafeLink to="/resources" className="text-muted-foreground hover:text-foreground">Resources</SafeLink>
                <SafeLink to="/faq" className="text-foreground">FAQ</SafeLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost"><SafeLink to="/login">Login</SafeLink></Button>
              <Button asChild><SafeLink to="/signup">Start Free Trial</SafeLink></Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-background via-primary-50/30 to-brand-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="text-4xl md:text-5xl font-bold mb-4">How can we help?</motion.h1>
          <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1}} className="text-lg text-muted-foreground">
            Answers to common questions about the product, pricing, teams, and security.
          </motion.p>
        </div>
      </section>

      {/* Featured cards */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          {categories.slice(0,3).map((c,i)=> (
            <motion.div key={c.title} initial={{opacity:0, y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.05}}>
              <Card className="border-gray-200 dark:border-gray-700/50 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center mb-2">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{c.title}</CardTitle>
                  <CardDescription>{c.items[0]?.q}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* All FAQs */}
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.map((c, idx)=> (
            <motion.div key={c.title} initial={{opacity:0, y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:idx*0.05}} className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><c.icon className="h-5 w-5" /> {c.title}</h2>
              <Card className="border-gray-200 dark:border-gray-700/50">
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {c.items.map((it, i)=> (
                      <AccordionItem key={`${c.title}-${i}`} value={`${c.title}-${i}`}>
                        <AccordionTrigger>{it.q}</AccordionTrigger>
                        <AccordionContent>{it.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-brand-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Still have questions?</h2>
          <p className="text-primary-100 mb-6">Reach out and we’ll get back within one business day.</p>
          <div className="flex justify-center">
            <Button asChild variant="secondary" className="bg-white text-primary-600 hover:bg-gray-100"><a href="mailto:hello@aifirst.academy">Contact Support</a></Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

