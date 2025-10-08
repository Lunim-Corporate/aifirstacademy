import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: January 1, 2025</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              These Terms of Service ("Terms") govern your access to and use of AI-First Academy (the "Service"). By
              accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you may not use the Service.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Eligibility & Accounts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li>You must be at least the age of majority in your jurisdiction to use the Service.</li>
                <li>You are responsible for safeguarding your account credentials and any activity under your account.</li>
                <li>You must provide accurate information and keep it up to date.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Content & License</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                You retain ownership of the content you submit ("User Content"). You grant us a worldwide, non-exclusive,
                royalty-free license to host, store, reproduce, modify, and display your User Content as necessary to
                operate, improve, and promote the Service. You are responsible for your User Content and must have all
                necessary rights to submit it.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acceptable Use & Prohibited Conduct</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li>Do not violate any applicable laws or regulations.</li>
                <li>Do not upload malicious code, attempt to gain unauthorized access, or disrupt the Service.</li>
                <li>Do not use the Service to generate or disseminate illegal, harmful, or infringing content.</li>
                <li>Respect others’ rights and privacy; do not post personal data without consent.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Features & Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                The Service may use AI to generate content. AI outputs can be imperfect, outdated, or inaccurate. You are
                responsible for reviewing and verifying outputs before relying on them. Do not use outputs as a substitute
                for professional advice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment & Subscriptions (If Applicable)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Some features may be offered on a paid basis. Prices, billing intervals, and cancellation policies will be
                disclosed at the time of purchase. Subscriptions renew automatically until canceled in accordance with the
                applicable terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                We and our licensors own all rights to the Service and its content (excluding User Content), including
                software, designs, and trademarks. You may not copy, modify, distribute, or create derivative works
                unless expressly permitted.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Your use of the Service is also governed by our <Link to="/privacy" className="underline">Privacy Policy</Link>.
                Please review it to understand how we collect and use information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                The Service may integrate with third-party services. We are not responsible for third-party content or
                practices. Use of third-party services is subject to their terms and policies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Availability & Changes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                We may modify, suspend, or discontinue the Service (in whole or part) at any time, with or without notice,
                and without liability. We may also impose limits on features and usage.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                We may suspend or terminate your access if you violate these Terms or if required by law. You may stop
                using the Service at any time. Certain provisions survive termination (e.g., intellectual property, disclaimers,
                limitation of liability).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
                INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT
                THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AI-FIRST ACADEMY AND ITS AFFILIATES WILL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL,
                ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                You agree to defend, indemnify, and hold harmless AI-First Academy and its affiliates from any claims,
                liabilities, damages, losses, and expenses (including legal fees) arising from your use of the Service or
                violation of these Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governing Law & Disputes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                These Terms are governed by the laws of your place of residence or, if not applicable, the laws of the
                jurisdiction where AI-First Academy is established, without regard to conflicts of law principles.
              </p>
              <p>
                Any dispute will be resolved through good-faith negotiations. If unresolved, the dispute shall be submitted
                to binding arbitration or the courts of competent jurisdiction, as permitted by applicable law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Controls & Sanctions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                You represent that you are not subject to any sanctions or restrictions that would prohibit your use of the
                Service and that you will comply with applicable export control laws and regulations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to These Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                We may update these Terms. We will post changes on this page and update the date above. Your continued use
                after changes become effective constitutes acceptance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Miscellaneous</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc pl-5 space-y-2">
                <li>Severability: If any provision is invalid, the remainder remains in effect.</li>
                <li>Waiver: Failure to enforce a provision is not a waiver of that provision.</li>
                <li>Assignment: You may not assign these Terms without our consent.</li>
                <li>Entire Agreement: These Terms constitute the entire agreement regarding the Service.</li>
                <li>Beta Features: Some features may be experimental and subject to additional terms.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                For questions about these Terms, contact our team at
                <span className="mx-1 font-medium text-foreground">legal@ai-first.academy</span> or return to the
                <Link to="/" className="ml-1 underline">homepage</Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

