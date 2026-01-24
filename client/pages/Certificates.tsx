import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Award,
  Settings,
  Download,
  Share,
  ExternalLink,
  CheckCircle,
  Clock,
  Star,
  Trophy,
  Medal,
  Target,
  Calendar,
  Eye,
  Linkedin,
  Copy,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import LoggedInHeader from "@/components/LoggedInHeader";
import Sidebar from "@/components/Sidebar";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiVerifyCertificate, apiListCertificates, apiGenerateCertificate, apiShareCertificate, apiMe, apiLearningTracks, apiGetProgress, apiDashboard } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Updated course navigation for marketing-only version.
// Original navigation kept for future use:
// const sidebarItems = [
//   { icon: Home, label: "Dashboard", href: "/dashboard" },
//   { icon: BookOpen, label: "Learning Path", href: "/learning" },
//   { icon: Code, label: "Sandbox", href: "/sandbox" },
//   { icon: Library, label: "Library", href: "/library" },
//   { icon: Users, label: "Community", href: "/community" },
//   { icon: Award, label: "Certificates", href: "/certificates", active: true },
//   { icon: Settings, label: "Settings", href: "/settings" },
// ];
const sidebarItems = [
  { icon: BookOpen, label: "Courses", href: "/learning" },
  { icon: Award, label: "Achievements", href: "/certificates", active: true },
  { icon: Settings, label: "Settings", href: "/settings" },
];

// Professional Certificate Component
function CertificatePreview({ 
  certificate, 
  user, 
  onDownload, 
  onShare 
}: { 
  certificate: any, 
  user: any, 
  onDownload: () => void, 
  onShare: (platform: string) => void 
}) {
  return (
    <div className="relative mx-auto aspect-[1.414] w-full max-w-4xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border-2 border-blue-100 rounded-2xl p-4 sm:p-8 lg:p-12 shadow-2xl print:shadow-none print:border-0 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_30%_20%,theme(colors.blue.500),transparent_50%),radial-gradient(circle_at_70%_80%,theme(colors.indigo.500),transparent_50%)]" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-12">
        <div className="flex-1">
          <div className="text-center space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">AI-First Academy</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Certificate of Completion</h1>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
          <Award className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center mb-16">
        <div className="space-y-8">
          <div>
            <div className="text-lg text-slate-600 mb-4">This certifies that</div>
            <div className="text-5xl font-bold text-slate-800 mb-2">{user?.name}</div>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
          </div>
          
          <div>
            <div className="text-lg text-slate-600 mb-4">has successfully completed the program</div>
            <div className="text-3xl font-semibold text-slate-700">{certificate?.title || 'AI Prompt Engineering Fundamentals'}</div>
          </div>
          
          <div className="text-lg text-center">
            <span className="text-slate-600">Completed on </span>
            <span className="font-semibold text-slate-800">
              {certificate?.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
              }) : 'January 15, 2024'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 grid grid-cols-2 gap-8 items-end border-t border-slate-200 pt-8 pr-32">
        <div className="text-center">
          <div className="w-24 h-0.5 bg-slate-300 mx-auto mb-3" />
          <div className="font-semibold text-slate-700">Dr. Sarah Chen</div>
          <div className="text-sm text-slate-500">Academy Director</div>
        </div>
        
        <div className="text-center">
          <div className="font-semibold text-slate-700">AI-First Academy</div>
          <div className="text-sm text-slate-500">www.aifirstacademy.com</div>
          <div className="mt-2 flex justify-center">
            <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>
          </div>
        </div>
      </div>
      
      {/* Credential ID - positioned separately to avoid QR code overlap */}
      <div className="absolute bottom-32 left-8 text-left">
        <div className="text-xs text-slate-500 mb-1">Credential ID</div>
        <div className="font-mono text-sm font-semibold text-slate-700 break-all max-w-[140px] sm:max-w-[200px]">
          {certificate?.credentialId || 'AIA-ENG-001-240115'}
        </div>
      </div>
      
      {/* QR Code */}
      <div className="absolute bottom-8 right-8 text-center">
        <div className="text-xs text-slate-500 mb-2">Scan to verify</div>
        <div className="w-20 h-20 bg-white rounded-lg shadow-md flex items-center justify-center border border-slate-200">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
              `${window.location.origin}/verify/${certificate?.credentialId || 'demo'}`
            )}`} 
            alt="Verification QR Code"
            className="w-16 h-16"
          />
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-16 right-32 w-2 h-2 bg-blue-400 rounded-full opacity-60" />
      <div className="absolute top-32 right-16 w-1 h-1 bg-indigo-400 rounded-full opacity-40" />
      <div className="absolute bottom-32 left-16 w-3 h-3 bg-blue-300 rounded-full opacity-30" />
    </div>
  );
}

const mockCertificates = [
  {
    id: "cert-1",
    title: "AI Prompt Engineering Fundamentals",
    track: "Engineering",
    status: "earned",
    issuedAt: "2024-01-15T10:30:00Z",
    score: 92,
    credentialId: "AIA-ENG-001-240115",
    description: "Demonstrates proficiency in basic prompt engineering techniques for software development"
  },
  {
    id: "cert-2", 
    title: "Advanced Code Generation Patterns",
    track: "Engineering",
    status: "in-progress",
    progress: 75,
    expectedDate: "2024-02-28",
    description: "Master advanced techniques for AI-assisted code generation and refactoring"
  },
];

// This will be populated from the API

export default function Certificates() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [availableCertifications, setAvailableCertifications] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [earnedCertificates, setEarnedCertificates] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        window.location.replace("/login");
      }
    }
  }, [user, authLoading]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user info  
        try {
          // Prefer auth context; fallback to API if needed
          if (!user) {
            const userInfo = await apiMe();
            // No local setUser; using context
          }
        } catch (error) {
          console.warn('Could not load user info:', error);
          // Continue with default user for demo purposes
        }
        
        // Load tracks to build certification requirements
        const tracksResponse = await apiLearningTracks();
        const tracks = tracksResponse.tracks || [];
        
        // Load user progress
        let progress = [];
        try {
          const progressResponse = await apiGetProgress();
          progress = progressResponse.progress || [];
          setUserProgress(progress);
        } catch (error) {
          console.warn('Could not load progress:', error);
        }
        
        // Build available certifications from tracks
        const certifications = tracks.map((track: any) => {
          const totalLessons = track.modules.reduce((sum: number, module: any) => sum + module.lessons.length, 0);
          const completedLessons = progress.filter((p: any) => 
            p.track_id === track.id && p.status === 'completed'
          ).length;
          
          const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          const isEligible = progressPercentage >= 80;
          
          return {
            id: `${track.id}-cert`,
            trackId: track.id,
            title: `${track.title} Certification`,
            description: track.description,
            modules: track.modules.length,
            estimatedTime: `${Math.round(track.modules.reduce((sum: number, module: any) => 
              sum + module.lessons.reduce((lessonSum: number, lesson: any) => lessonSum + (lesson.durationMin || 0), 0), 0
            ) / 60)} hours`,
            difficulty: track.level || 'Intermediate',
            progress: progressPercentage,
            isEligible,
            requirements: [
              `Complete all ${track.modules.length} ${track.title} modules`,
              "Achieve 80% completion rate",
              "Pass module assessments"
            ]
          };
        });
        
        setAvailableCertifications(certifications);
        
        // Check for earned certificates (those with 100% completion)
        const earned = certifications
          .filter((cert: any) => cert.progress >= 100)
          .map((cert: any) => ({
            id: `cert-${cert.trackId}`,
            title: cert.title,
            track: cert.title.replace(' Certification', ''),
            status: "earned",
            issuedAt: new Date().toISOString(),
            score: 95,
            credentialId: `AIA-${cert.trackId.toUpperCase()}-${Date.now()}`,
            description: cert.description
          }));
        
        setEarnedCertificates(earned);
        
        // Load skills / skills assessment from dashboard for Achievements view
        try {
          const dash = await apiDashboard();
          setSkills(dash.skills || []);
        } catch (err) {
          console.warn("Could not load skills assessment:", err);
        }
      } catch (error) {
        console.error('Failed to load certificate data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const demoCredentialId = "AIA-ENG-001-240115";
  const demoVerifyUrl = typeof window !== "undefined" ? `${window.location.origin}/verify/${encodeURIComponent(demoCredentialId)}` : `/verify/${encodeURIComponent(demoCredentialId)}`;
  
  const handleCertificatePreview = (certificate) => {
    setSelectedCertificate(certificate);
    setIsPreviewModalOpen(true);
  };
  
  const handleDownload = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate - ${selectedCertificate?.title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: A4 landscape; margin: 0; }
              @media print { 
                body { background: white !important; }
                .print-hide { display: none !important; }
              }
            </style>
          </head>
          <body class="bg-white p-8">
            <div id="certificate-preview">
              ${document.getElementById('certificate-preview-modal')?.innerHTML || ''}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
    }
  };
  
  const handleShare = (platform: string) => {
    const certificateUrl = `${window.location.origin}/verify/${selectedCertificate?.credentialId}`;
    const text = `I just earned my ${selectedCertificate?.title} certificate from AI-First Academy! 🎓`;
    
    switch (platform) {
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}&title=${encodeURIComponent(text)}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(certificateUrl)}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(certificateUrl);
        setCopiedText('Verification URL copied!');
        setTimeout(() => setCopiedText(''), 3000);
        break;
    }
    setShareDialogOpen(false);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoggedInHeader />
        <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-64" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-3 w-80" />
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <LoggedInHeader />

      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Achievements</h1>
              <p className="text-muted-foreground">Track your marketing AI skills and earned certificates.</p>
            </div>
          </div>

          {/* Progress Overview & Skills Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Certificates Earned</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{earnedCertificates.length}</div>
                <p className="text-xs text-muted-foreground">
                  of {availableCertifications.length} available tracks
                </p>
              </CardContent>
            </Card>
            
            {/* Skills Assessment moved here from dashboard */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skills Assessment</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                {skills.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Your skills assessment will appear here once you start completing courses.
                  </p>
                ) : (
                  skills.map((skill: any) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {skill.level}
                        </Badge>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {skill.progress}%
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </div>

          {/* Certificates section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Certificates</h2>
            <div className="grid gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableCertifications.filter(cert => cert.progress > 0 && cert.progress < 100).length}</div>
                <p className="text-xs text-muted-foreground">
                  certification{availableCertifications.filter(cert => cert.progress > 0 && cert.progress < 100).length !== 1 ? 's' : ''} in progress
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skill Level</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {earnedCertificates.length > 0 ? 'Advanced' : 
                   availableCertifications.some(cert => cert.progress > 50) ? 'Intermediate' : 'Beginner'}
                </div>
                <p className="text-xs text-muted-foreground">
                  based on completed work
                </p>
              </CardContent>
            </Card>

              {(earnedCertificates.length > 0 ? earnedCertificates : mockCertificates).map((cert: any) => (
                <Card key={cert.id} className={cert.status === "earned" ? "border-success/20 bg-success/5" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg break-words">{cert.title}</CardTitle>
                          {cert.status === "earned" && (
                            <Badge className="bg-success text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Earned
                            </Badge>
                          )}
                          {cert.status === "in-progress" && (
                            <Badge variant="outline" className="border-brand-200 text-brand-700">
                              <Clock className="h-3 w-3 mr-1" />
                              In Progress
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{cert.description}</CardDescription>
                        <Badge variant="outline">{cert.track} Track</Badge>
                      </div>
                      
                      {cert.status === "earned" && (
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleCertificatePreview(cert)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        {/*}  <Button variant="outline" size="sm" onClick={async()=>{ const v = await apiVerifyCertificate(cert.credentialId); const url = v.valid && v.verifyUrl ? v.verifyUrl : `${window.location.origin}/verify/${encodeURIComponent(cert.credentialId)}`; window.open(url, "_blank"); }}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Verify
                          </Button> */}
                          <Button variant="outline" size="sm" onClick={()=>{ const url = `${window.location.origin}/verify/${encodeURIComponent(cert.credentialId)}`; window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank"); }}>
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {cert.status === "earned" && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Date Earned:</span>
                          <div className="font-medium">{new Date(cert.issuedAt!).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Score:</span>
                          <div className="font-medium">{cert.score}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Credential ID:</span>
                          <div className="font-medium font-mono text-xs break-all">{cert.credentialId}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className="font-medium text-success">Valid</div>
                        </div>
                      </div>
                    )}
                    
                    {cert.status === "in-progress" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="text-muted-foreground">{cert.progress}%</span>
                          </div>
                          <Progress value={cert.progress} className="h-2" />
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Expected completion: {cert.expectedDate || 'In progress'}</span>
                            <Button size="sm" onClick={() => {
                              // Find the track and navigate to first incomplete lesson
                              const track = availableCertifications.find(c => c.title === cert.title);
                              if (track) {
                                window.location.href = '/learning';
                              }
                            }}>Continue Learning</Button>
                          </div>
                        </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Certificate Preview Dialog */}
          <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] p-0 flex flex-col">
              <DialogHeader className="p-6 pb-0 flex-shrink-0">
                <DialogTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-brand-600" />
                  <span>Certificate Preview</span>
                </DialogTitle>
                <DialogDescription>
                  Your AI-First Academy certificate is ready to download and share
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-6 pt-0">
                <div id="certificate-preview-modal" className="mb-6">
                  <CertificatePreview 
                    certificate={selectedCertificate} 
                    user={user} 
                    onDownload={handleDownload}
                    onShare={handleShare}
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex-shrink-0 p-6 pt-0">
                <div className="flex items-center justify-center border-t pt-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    {copiedText && (
                      <span className="text-green-600 font-medium mr-4">{copiedText}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={() => handleShare('copy')}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button variant="outline" onClick={() => handleShare('linkedin')}>
                      <Linkedin className="h-4 w-4 mr-2" />
                      Share on LinkedIn
                    </Button>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Sample Certificate Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-brand-600" />
                Certificate Design Preview
              </CardTitle>
              <CardDescription>See what your certificate will look like</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="origin-top-left md:scale-75 md:origin-top-left md:w-[133%] md:h-[133%]">
                <CertificatePreview 
                  certificate={mockCertificates[0]} 
                  user={user} 
                  onDownload={() => {}} 
                  onShare={() => {}}
                />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Certifications */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Available Certifications</h2>
            <div className="grid gap-6">
              {availableCertifications.map((cert) => (
                <Card key={cert.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{cert.title}</CardTitle>
                        <CardDescription>{cert.description}</CardDescription>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{cert.modules} modules</span>
                          <span>•</span>
                          <span>{cert.estimatedTime}</span>
                          <span>•</span>
                          <Badge variant="outline">{cert.difficulty}</Badge>
                        </div>
                      </div>
                      <Button>
                        <Target className="h-4 w-4 mr-2" />
                        Start Track
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-medium">Requirements:</h4>
                      <ul className="space-y-2">
                        {cert.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Certificate Verification */}
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Medal className="h-5 w-5 mr-2 text-brand-600" />
                Certificate Verification
              </CardTitle>
              <CardDescription>
                All AI-First Academy certificates are blockchain-verified and include unique credential IDs for easy verification by employers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={()=> window.location.href = `/verify/${encodeURIComponent(demoCredentialId)}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify a Certificate
                </Button>
                <Button variant="outline" onClick={()=> window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(demoVerifyUrl)}`, "_blank") }>
                  <Share className="h-4 w-4 mr-2" />
                  Add to LinkedIn
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

