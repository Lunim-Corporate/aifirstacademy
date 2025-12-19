import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BrainCircuit,
  Code,
  Users,
  BookOpen,
  Zap,
  Target,
  Check,
  Star,
  ArrowRight,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SafeLink from "@/components/SafeLink";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import MarketingFooter from "@/components/MarketingFooter";
import TrustedByMarquee from "@/components/TrustedByMarquee";

export default function Index() {
  const [showDemo, setShowDemo] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-700/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <BrainCircuit className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold" style={{color: 'white'}}>AI-First Marketing Academy</span>
              </div>
              <div className="hidden md:ml-10 md:flex space-x-8">
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <SafeLink to="/login">Login</SafeLink>
              </Button>
              <Button asChild className="bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black">
                <SafeLink to="/signup">Create Free Account</SafeLink>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary-50/30 to-brand-50/30">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground">
                  Master <span className="gradient-text">Marketing AI Workflows</span> that ship
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Learn, practice, and certify practical AI skills through interactive challenges and real-time LLM feedback. Built for marketers.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black" onClick={() => navigate('/signup')}>
                  Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowDemo(true)}
                  className="group bg-black text-white border-white hover:bg-black hover:text-white"
                >
                  <Play className="mr-2 h-4 w-4 text-white group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center"><Check className="h-4 w-4 text-success mr-2" />Free</div>
                <div className="flex items-center"><Check className="h-4 w-4 text-success mr-2" />2-hour onboarding</div>
                <div className="flex items-center"><Check className="h-4 w-4 text-success mr-2" />Live LLM scoring</div>
              </div>
            </div>
            <div className="relative transform rotate-6 translate-y-2 translate-x-2 scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-primary-400/20 rounded-2xl blur-3xl" />
              <Card className="relative bg-background/80 backdrop-blur border-gray-200 dark:border-gray-700/50 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-gradient-to-r from-primary-600 to-brand-600 text-white">Prompt Playground</Badge>
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-destructive rounded-full" />
                      <div className="w-3 h-3 bg-warning rounded-full" />
                      <div className="w-3 h-3 bg-success rounded-full" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-brand-600 mb-2">// Your prompt:</div>
                    <div className="text-foreground">Generate a React component for a user profile card with avatar, name, and badges.</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-success flex items-center"><Check className="h-4 w-4 mr-1" />Score: 87/100</div>
                    <div className="text-muted-foreground">GPT-4 • 245 tokens</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / Social Proof */}
      <TrustedByMarquee logos={["TechCorp","ScaleUp","GrowthCo","DevWorks","PixelLabs","DataForge"]} duration={0.8} delay={0} ease="power3.out" slideFrom="bottom" />

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Everything You Need to Master AI</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Hands-on learning with real AI feedback, rich content, and enterprise controls.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700/50">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                  <Code className="h-6 w-6 text-brand-600" />
                </div>
                <CardTitle>Interactive Playground</CardTitle>
                <CardDescription>Practice with live LLMs and get instant scoring.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700/50">
              <CardHeader>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                  <BookOpen className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>Structured Tracks</CardTitle>
                <CardDescription>Role-based paths for marketing professionals.</CardDescription>
              </CardHeader>
            </Card>

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Trusted by Marketers Worldwide</h2>
            <p className="text-xl text-muted-foreground">Real outcomes, fast adoption</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[{
              name: 'Sarah Martinez', role: 'Senior Developer, TechCorp', quote: 'The sandbox changed how we write prompts. Consistent quality in 2 weeks.'
            },{
              name: 'Michael Johnson', role: 'VP Engineering, ScaleUp', quote: 'Cohorts and analytics made rollout seamless across 200+ engineers.'
            },{
              name: 'Emily Parker', role: 'Marketing Director, GrowthCo', quote: 'I ship campaign briefs in hours, not days.'
            }].map((t, i)=> (
              <Card key={i} className="border-gray-200 dark:border-gray-700/50">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">“{t.quote}”</p>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback>{t.name.split(' ').map(s=>s[0]).slice(0,2).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to transform your AI workflows?</h2>
          <p className="text-xl text-muted-foreground mb-8">Start free today and master marketing AI workflows.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="bg-[#bdeeff] hover:bg-[#bdeeff]/90 text-black"
            >
              Create Free Account
            </Button>
            <Button size="lg" variant="outline" className="border-foreground text-foreground hover:bg-foreground/5" onClick={() => setShowDemo(true)}>
              Watch Demo
            </Button>
          </div>
        </div>
      </section>


      <MarketingFooter />

      <Dialog open={showDemo} onOpenChange={setShowDemo}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Demo</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded-md"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="AI-First Marketing Academy Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

