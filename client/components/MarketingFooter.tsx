import { Button } from "@/components/ui/button";
import { BrainCircuit, Github, Linkedin, Twitter } from "lucide-react";
import SafeLink from "@/components/SafeLink";

export default function MarketingFooter() {
  return (
    <footer className="bg-background border-t border-gray-200 dark:border-gray-700/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <BrainCircuit className="h-8 w-8 text-brand-600" />
              <span className="ml-2 text-xl font-bold gradient-text">AI-First Academy</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Practical AI workflow training for modern teams. Learn, practice, and certify your AI skills.
            </p>
            <div className="flex space-x-4">
              <Button size="sm" variant="ghost" asChild>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><SafeLink to="/product" className="hover:text-foreground transition-colors">Overview</SafeLink></li>
              <li><SafeLink to="/pricing" className="hover:text-foreground transition-colors">Pricing</SafeLink></li>
              <li><SafeLink to="/teams" className="hover:text-foreground transition-colors">For Teams</SafeLink></li>
              <li><SafeLink to="/resources" className="hover:text-foreground transition-colors">Resources</SafeLink></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><SafeLink to="/resources" className="hover:text-foreground transition-colors">Guides</SafeLink></li>
              <li><SafeLink to="/resources" className="hover:text-foreground transition-colors">Videos</SafeLink></li>
              <li><SafeLink to="/faq" className="hover:text-foreground transition-colors">FAQ</SafeLink></li>
              <li><SafeLink to="/community" className="hover:text-foreground transition-colors">Community</SafeLink></li>
              <li><SafeLink to="/library" className="hover:text-foreground transition-colors">Library</SafeLink></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><SafeLink to="/about" className="hover:text-foreground transition-colors">About</SafeLink></li>
              <li><SafeLink to="/privacy" className="hover:text-foreground transition-colors">Privacy</SafeLink></li>
              <li><SafeLink to="/terms" className="hover:text-foreground transition-colors">Terms</SafeLink></li>
              <li><a href="mailto:hello@aifirst.academy" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700/40 mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 AI-First Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

