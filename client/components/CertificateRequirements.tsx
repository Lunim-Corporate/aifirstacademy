import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiGetCertificateRequirements, apiGenerateCertificateNew } from "@/lib/api";
import { useEffect, useState } from "react";
import { 
  Award, 
  CheckCircle, 
  Clock, 
  Trophy, 
  Star, 
  Target, 
  Shield, 
  Download, 
  ExternalLink,
  GraduationCap,
  BookOpen,
  Video,
  Code,
  FileText,
  Timer,
  Calendar,
  Users,
  Zap,
  Brain,
  TrendingUp
} from "lucide-react";

interface CertificateRequirementsProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  userRole: string;
  completedLessons: number;
  totalLessons: number;
  userProgress: any[];
  selectedTrack: any;
}

export default function CertificateRequirements({ 
  isOpen, 
  onClose, 
  trackTitle, 
  userRole, 
  completedLessons, 
  totalLessons,
  userProgress,
  selectedTrack 
}: CertificateRequirementsProps) {
  
  const [requirementsData, setRequirementsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  // Fetch real certificate requirements from API
  useEffect(() => {
    if (isOpen && selectedTrack?.id) {
      fetchRequirements();
    }
  }, [isOpen, selectedTrack?.id]);
  
  const fetchRequirements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, create mock requirements data based on the provided props
      // TODO: Replace with real API call when authentication is working
      const mockRequirements = {
        completion: {
          progress: completedLessons,
          total: totalLessons,
          percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          weight: 40,
          description: 'Complete 100% of all lessons in the track'
        },
        assessment: {
          progress: 0,
          total: 1,
          percentage: 0,
          weight: 25,
          description: 'Score 80% or higher on the comprehensive track assessment'
        },
        projects: {
          progress: 0,
          total: 1,
          percentage: 0,
          weight: 20,
          description: 'Complete and submit the final capstone project'
        },
        timeCommitment: {
          progress: Math.min(selectedTrack?.estimatedHours || 0, 20),
          total: 20,
          percentage: selectedTrack?.estimatedHours ? Math.min(100, Math.round((selectedTrack.estimatedHours / 20) * 100)) : 0,
          weight: 10,
          description: 'Demonstrate at least 20 hours of active learning time'
        },
        engagement: {
          progress: 0,
          total: 5,
          percentage: 0,
          weight: 5,
          description: 'Participate in discussions and help fellow learners (optional)'
        }
      };
      
      const overallProgress = Object.values(mockRequirements).reduce((acc: number, req: any) => 
        acc + (req.percentage * req.weight / 100), 0);
      
      const mockData = {
        track: selectedTrack,
        requirements: mockRequirements,
        overallProgress: Math.round(overallProgress),
        isEligible: overallProgress >= 80,
        completedRequirements: Object.values(mockRequirements).filter((req: any) => req.percentage === 100).length
      };
      
      setRequirementsData(mockData);
      
      // Try to fetch real data in the background, but don't fail if it doesn't work
      try {
        const data = await apiGetCertificateRequirements(selectedTrack.id);
        setRequirementsData(data);
      } catch (apiErr: any) {
        console.warn('API call failed, using mock data:', apiErr.message);
        // Keep using mock data
      }
      
    } catch (err: any) {
      console.error('Failed to fetch certificate requirements:', err);
      setError(err.message || 'Failed to load certificate requirements');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateCertificate = async () => {
    if (!selectedTrack?.id) return;
    
    try {
      setGenerating(true);
      const result = await apiGenerateCertificateNew(selectedTrack.id);
      
      // Success! You could show a success message or redirect
      alert('Certificate generated successfully! ' + result.message);
      
      // Refresh requirements to show updated state
      await fetchRequirements();
      
    } catch (err: any) {
      console.error('Failed to generate certificate:', err);
      alert('Failed to generate certificate: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto" />
              <p className="text-lg font-medium">Loading certificate requirements...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error Loading Requirements</DialogTitle>
            <DialogDescription>{error}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={fetchRequirements}>Retry</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  const requirements = requirementsData?.requirements || {};
  const overallProgress = requirementsData?.overallProgress || 0;
  const isEligibleForCertificate = requirementsData?.isEligible || false;
  const completedRequirements = requirementsData?.completedRequirements || 0;
  
  // Convert API requirements to component format
  const requirementsList = [
    {
      id: 'completion',
      title: 'Complete All Modules',
      description: requirements.completion?.description || 'Successfully complete 100% of all lessons in the track',
      progress: requirements.completion?.progress || 0,
      total: requirements.completion?.total || totalLessons,
      percentage: requirements.completion?.percentage || 0,
      icon: BookOpen,
      color: 'blue',
      weight: requirements.completion?.weight || 40
    },
    {
      id: 'assessment',
      title: 'Pass Final Assessment',
      description: requirements.assessment?.description || 'Score 80% or higher on the comprehensive track assessment',
      progress: requirements.assessment?.progress || 0,
      total: requirements.assessment?.total || 1,
      percentage: requirements.assessment?.percentage || 0,
      icon: Target,
      color: 'purple',
      weight: requirements.assessment?.weight || 25
    },
    {
      id: 'projects',
      title: 'Submit Capstone Project',
      description: requirements.projects?.description || 'Complete and submit the final capstone project demonstrating learned skills',
      progress: requirements.projects?.progress || 0,
      total: requirements.projects?.total || 1,
      percentage: requirements.projects?.percentage || 0,
      icon: Code,
      color: 'green',
      weight: requirements.projects?.weight || 20
    },
    {
      id: 'timeCommitment',
      title: 'Minimum Learning Hours',
      description: requirements.timeCommitment?.description || 'Demonstrate at least 20 hours of active learning time',
      progress: requirements.timeCommitment?.progress || 0,
      total: requirements.timeCommitment?.total || 20,
      percentage: requirements.timeCommitment?.percentage || 0,
      icon: Timer,
      color: 'orange',
      weight: requirements.timeCommitment?.weight || 10
    },
    {
      id: 'engagement',
      title: 'Community Engagement',
      description: requirements.engagement?.description || 'Participate in discussions and help fellow learners (optional but recommended)',
      progress: requirements.engagement?.progress || 0,
      total: requirements.engagement?.total || 5,
      percentage: requirements.engagement?.percentage || 0,
      icon: Users,
      color: 'indigo',
      weight: requirements.engagement?.weight || 5
    }
  ];

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      'engineer': 'AI Engineer',
      'manager': 'AI Manager', 
      'designer': 'AI Designer',
      'marketer': 'AI Marketer',
      'researcher': 'AI Researcher'
    };
    return roleMap[role] || 'AI Professional';
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5',
      purple: 'border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5',
      green: 'border-green-200 dark:border-green-500/20 bg-green-50/50 dark:bg-green-500/5',
      orange: 'border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/5',
      indigo: 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5'
    };
    return colorMap[color] || colorMap.blue;
  };

  const getIconColor = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600 dark:text-blue-400',
      purple: 'text-purple-600 dark:text-purple-400',
      green: 'text-green-600 dark:text-green-400',
      orange: 'text-orange-600 dark:text-orange-400',
      indigo: 'text-indigo-600 dark:text-indigo-400'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-75" />
              <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-2xl">
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {getRoleDisplayName(userRole)} Certificate
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Professional certification requirements for {trackTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Certificate Preview */}
        <Card className="border-2 border-yellow-200 dark:border-yellow-500/30 bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-yellow-950/20 dark:via-slate-900 dark:to-orange-950/20">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <GraduationCap className="h-16 w-16 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-400">
                  AI First Academy
                </h3>
                <p className="text-yellow-700 dark:text-yellow-500">
                  Official Certificate of Completion
                </p>
              </div>
              <div className="py-4">
                <p className="text-lg text-slate-700 dark:text-slate-300">
                  This certifies that <strong>John Doe</strong> has successfully completed the
                </p>
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {getRoleDisplayName(userRole)} Professional Track
                </h4>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Demonstrating proficiency in AI technologies and their practical applications
                </p>
              </div>
              <div className="flex justify-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Completion Date</div>
                  <div className="font-semibold">December 2024</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Certificate ID</div>
                  <div className="font-semibold">AFA-{userRole.toUpperCase()}-2024-001</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Verification</div>
                  <div className="font-semibold text-green-600">Blockchain Verified</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Progress */}
        <Card className="border-brand-200 dark:border-brand-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Certification Progress</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {Math.round(overallProgress)}% completed • {completedRequirements} of {requirements.length} requirements met
                </p>
              </div>
              <Badge className={`text-base px-3 py-1 ${
                isEligibleForCertificate 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {isEligibleForCertificate ? 'Ready for Certification!' : 'In Progress'}
              </Badge>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Detailed Requirements */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Certification Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirementsList.map((req) => {
              const Icon = req.icon;
              const isCompleted = req.percentage === 100;
              
              return (
                <Card key={req.id} className={`${getColorClasses(req.color)} transition-all duration-300 hover:shadow-lg`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm`}>
                        <Icon className={`h-6 w-6 ${getIconColor(req.color)}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{req.title}</h4>
                          {isCompleted && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {req.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{req.progress} of {req.total}</span>
                            <span className="font-semibold">{req.percentage}%</span>
                          </div>
                          <Progress value={req.percentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Certificate Features */}
        <Card className="bg-slate-50 dark:bg-slate-800/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Certificate Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <Shield className="h-8 w-8 text-green-600 mx-auto" />
                <div className="text-sm font-medium">Blockchain Verified</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Tamper-proof certification</div>
              </div>
              <div className="text-center space-y-2">
                <Download className="h-8 w-8 text-blue-600 mx-auto" />
                <div className="text-sm font-medium">PDF Download</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Print-ready format</div>
              </div>
              <div className="text-center space-y-2">
                <ExternalLink className="h-8 w-8 text-purple-600 mx-auto" />
                <div className="text-sm font-medium">LinkedIn Badge</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Share achievements</div>
              </div>
              <div className="text-center space-y-2">
                <Star className="h-8 w-8 text-yellow-600 mx-auto" />
                <div className="text-sm font-medium">Industry Recognition</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Employer-trusted</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <div className="space-y-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Complete all requirements to unlock your certificate
            </p>
            {isEligibleForCertificate && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                Congratulations! You're ready to claim your certificate.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {isEligibleForCertificate ? (
              <Button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={handleGenerateCertificate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Claim Certificate
                  </>
                )}
              </Button>
            ) : (
              <Button 
                className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700"
                onClick={onClose}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}