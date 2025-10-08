import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative mx-auto max-w-4xl p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: January 1, 2025</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              AI-First Academy ("we", "us", "our") is committed to protecting your privacy. This policy explains what
              information we collect, how we use it, the choices you have, and your rights under applicable laws.
            </p>
            <p>
              By using our services, you agree to this policy. If you do not agree, please discontinue use.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Account Data: name, email, password (hashed), role, and authentication tokens necessary to create and
                  secure your account.
                </li>
                <li>
                  Usage Data: pages visited, features used, time spent, interaction logs, device and browser information,
                  IP address, and approximate location derived from IP.
                </li>
                <li>
                  Content You Provide: prompts, discussions, challenge entries, files/links you upload or submit.
                </li>
                <li>
                  Cookies & Similar Technologies: used for authentication, preferences, analytics, and security.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide, maintain, and improve the platform and its features.</li>
                <li>Authenticate you and secure the platform, prevent fraud and abuse.</li>
                <li>Personalize content, recommendations, and learning experiences.</li>
                <li>Analyze usage to understand performance and plan improvements.</li>
                <li>Communicate with you about updates, security alerts, and support.</li>
                <li>Comply with legal obligations and enforce our terms.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legal Bases</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>We process personal data under these bases (as applicable):</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Performance of a contract (providing the service you request).</li>
                <li>Legitimate interests (improving and securing our services).</li>
                <li>Consent (where required, e.g., certain analytics or marketing).</li>
                <li>Compliance with legal obligations.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Processing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                When you use AI-related features (e.g., prompts, challenge entries), your inputs may be processed by AI
                models to generate results. We do not sell your data. We apply access controls and minimize retention of
                raw prompts where feasible. Avoid submitting sensitive personal information in prompts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sharing & Disclosures</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>We share information only as necessary:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Service Providers: hosting, storage, analytics, and customer support providers under contract.</li>
                <li>Legal & Safety: to comply with law, protect rights, security, and prevent fraud.</li>
                <li>Business Transfers: in a merger, acquisition, or asset sale, subject to safeguards.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>International Transfers</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                We may transfer data across borders. Where required, we use appropriate safeguards (e.g., standard
                contractual clauses) to protect your information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retention</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                We retain personal data only as long as necessary for the purposes described above, to comply with legal
                obligations, resolve disputes, and enforce agreements. We apply retention schedules and secure deletion.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                We use administrative, technical, and organizational measures to protect data (encryption in transit,
                access controls, monitoring). No method is 100% secure; please use strong passwords and protect your
                account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access, correct, update, or delete your personal information.</li>
                <li>Object to or restrict processing, and request data portability.</li>
                <li>Withdraw consent where processing is based on consent.</li>
                <li>Lodge a complaint with your local supervisory authority.</li>
              </ul>
              <p>
                To exercise rights, contact us using the details below. We may verify your identity before fulfilling your
                request.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Our services are not directed to children under 13 (or the age defined by local law). We do not knowingly
                collect personal information from children. If you believe a child has provided personal data, contact us
                to remove it.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies & Preferences</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                You can manage cookies through your browser settings. Disabling cookies may impact certain features (e.g.,
                staying signed in).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to this Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                We may update this policy from time to time. We will post the updated version and adjust the "Last
                updated" date. Significant changes will be communicated where appropriate.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                For questions or privacy requests, please contact our team at
                <span className="mx-1 font-medium text-foreground">privacy@ai-first.academy</span> or write to us via
                the <Link to="/" className="underline">homepage</Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

