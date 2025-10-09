import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, ExternalLink, Share2, ArrowLeft } from "lucide-react";
import { apiVerifyCertificate } from "@/lib/api";

export default function VerifyCertificate() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const routeId = useParams().credentialId || "";
  const qpId = sp.get("id") || "";
  const credentialId = routeId || qpId;
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ valid: boolean; certificate?: any; verifyUrl?: string } | null>(null);

  const shareUrl = useMemo(() => `${window.location.origin}/verify/${encodeURIComponent(credentialId)}`, [credentialId]);

  useEffect(() => {
    let cancelled = false;
    if (!credentialId) { setLoading(false); setResult(null); return; }
    (async () => {
      try {
        const data = await apiVerifyCertificate(credentialId);
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setResult({ valid: false });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [credentialId]);

  useEffect(() => {
    const title = result?.valid ? `Certificate ${credentialId} • Valid` : `Certificate ${credentialId} • Invalid`;
    document.title = title;
    const ensureMeta = (name: string) => {
      let el = document.querySelector(`meta[property='${name}']`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", name); document.head.appendChild(el); }
      return el;
    };
    const ogTitle = ensureMeta("og:title"); ogTitle.content = title;
    const ogDesc = ensureMeta("og:description"); ogDesc.content = result?.valid ? "Verified AIFS Academy certificate" : "Certificate not found";
    const ogUrl = ensureMeta("og:url"); ogUrl.content = shareUrl;
  }, [result, credentialId, shareUrl]);

  if (!credentialId) {
    const [idInput, setIdInput] = useState("");
    return (
      <div className="min-h-screen bg-background">
        <LoggedInHeader />
        <main className="max-w-3xl mx-auto p-6 space-y-4">
          <h1 className="text-2xl font-bold">Verify a Certificate</h1>
          <Card>
            <CardHeader>
              <CardTitle>Enter Certificate ID</CardTitle>
              <CardDescription>Paste the ID from your certificate to verify its authenticity.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input value={idInput} onChange={(e)=>setIdInput(e.target.value)} placeholder="e.g., AIA-ENG-001-240115" className="flex-1 border rounded px-3 py-2 bg-background" />
                <Button onClick={()=>{ if (idInput.trim()) nav(`/verify/${encodeURIComponent(idInput.trim())}`); }}>Verify</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoggedInHeader />
        <main className="max-w-3xl mx-auto p-6">
          <Skeleton className="h-10 w-64 mb-4" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const cert = result?.certificate;

  return (
    <div className="min-h-screen bg-background">
      <LoggedInHeader />
      <main className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Certificate Verification</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/certificates"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
            </Button>
            <Button variant="outline" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank") }>
              <Share2 className="h-4 w-4 mr-2" />Share on LinkedIn
            </Button>
            <Button variant="outline" onClick={() => window.open(result?.verifyUrl || shareUrl, "_blank") }>
              <ExternalLink className="h-4 w-4 mr-2" />Open Verify API
            </Button>
          </div>
        </div>

        <Card className={result?.valid ? "border-green-200 bg-green-50/40 dark:bg-green-950/20" : "border-red-200 bg-red-50/40 dark:bg-red-950/20"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  {result?.valid ? (
                    <><CheckCircle2 className="h-5 w-5 text-green-600 mr-2" /> Status: Valid</>
                  ) : (
                    <><AlertCircle className="h-5 w-5 text-red-600 mr-2" /> Status: Invalid / Not Found</>
                  )}
                </CardTitle>
                <CardDescription>Verification for credential ID <span className="font-mono">{credentialId}</span></CardDescription>
              </div>
              <Badge variant="outline">AIFS Academy</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {result?.valid && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Learner:</span> <span className="font-medium">{cert?.userId || "Learner"}</span></div>
                  <div><span className="text-muted-foreground">Program:</span> <span className="font-medium">{cert?.title}</span></div>
                  <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(cert?.issuedAt).toLocaleDateString()}</span></div>
                  <div><span className="text-muted-foreground">Certificate ID:</span> <span className="font-medium font-mono text-xs">{cert?.credentialId}</span></div>
                </div>
                <div className="flex items-center md:justify-end">
                  <img className="w-32 h-32 bg-white p-2 rounded border" src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`} alt="QR code linking to verification page" />
                </div>
              </div>
            )}
            {!result?.valid && (
              <div className="text-sm text-muted-foreground">Certificate not valid. Please check the ID and try again.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

