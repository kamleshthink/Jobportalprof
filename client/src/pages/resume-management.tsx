import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { FileText, Edit2, Upload, Download, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { ResumeBuilderForm } from '@/components/resume/resume-builder-form';
import { ResumeUpload } from '@/components/resume/resume-upload';
import type { ResumeData } from '@shared/mongodb-types';

export default function ResumeManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [hasUploadedResume, setHasUploadedResume] = useState(false);
  const [resumePath, setResumePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserResume = async () => {
      try {
        const response = await apiRequest('GET', '/api/users/resume');
        
        if (response.status === 404) {
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch resume');
        }
        
        const data = await response.json();
        
        if (data.builtResume) {
          setResumeData(data.builtResume);
        }
        
        if (data.resumePath) {
          setResumePath(data.resumePath);
          setHasUploadedResume(true);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching resume:', error);
        setIsLoading(false);
      }
    };

    fetchUserResume();
  }, []);

  const handleResumeBuilderComplete = (data: ResumeData) => {
    setResumeData(data);
    setActiveTab('overview');
  };

  const handleResumeUploadComplete = (path: string) => {
    setResumePath(path);
    setHasUploadedResume(true);
    setActiveTab('overview');
  };

  const handleDeleteResume = async (type: 'built' | 'uploaded') => {
    try {
      const endpoint = type === 'built' ? '/api/users/resume/built' : '/api/users/resume/uploaded';
      
      const response = await apiRequest('DELETE', endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete ${type} resume`);
      }
      
      if (type === 'built') {
        setResumeData(null);
      } else {
        setResumePath(null);
        setHasUploadedResume(false);
      }
      
      toast({
        title: 'Resume Deleted',
        description: `Your ${type} resume has been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'There was an error. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resume Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, upload, and manage your resume to apply for jobs easily.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="build">Build Resume</TabsTrigger>
            <TabsTrigger value="upload">Upload Resume</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Built Resume Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Edit2 className="h-5 w-5 mr-2 text-primary" />
                    Built Resume
                  </CardTitle>
                  <CardDescription>
                    Resume created using our resume builder
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {resumeData ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg">
                        <div>
                          <p className="font-medium">{resumeData.personalInfo.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resumeData.personalInfo.email}
                          </p>
                          <div className="mt-4">
                            <p className="text-sm"><span className="font-medium">Skills:</span> {resumeData.skills.join(', ')}</p>
                          </div>
                        </div>
                        <FileText className="h-10 w-10 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">You haven't created a resume yet</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  {resumeData ? (
                    <>
                      <Button variant="outline" onClick={() => setActiveTab('build')}>
                        Edit Resume
                      </Button>
                      <Button variant="destructive" onClick={() => handleDeleteResume('built')}>
                        Delete Resume
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full" onClick={() => setActiveTab('build')}>
                      <Edit2 className="h-4 w-4 mr-2" /> Build Resume
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Uploaded Resume Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-primary" />
                    Uploaded Resume
                  </CardTitle>
                  <CardDescription>
                    Your uploaded resume document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasUploadedResume && resumePath ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg">
                        <div>
                          <p className="font-medium">Resume Document</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resumePath.split('/').pop()}
                          </p>
                        </div>
                        <FileText className="h-10 w-10 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">You haven't uploaded a resume yet</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  {hasUploadedResume && resumePath ? (
                    <>
                      <Button variant="outline" asChild>
                        <a href={resumePath} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" /> View Resume
                        </a>
                      </Button>
                      <Button variant="destructive" onClick={() => handleDeleteResume('uploaded')}>
                        Delete Resume
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full" onClick={() => setActiveTab('upload')}>
                      <Upload className="h-4 w-4 mr-2" /> Upload Resume
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>

            {/* Resume Parsing Analysis Section (if a resume is uploaded) */}
            {hasUploadedResume && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resume Analysis</CardTitle>
                  <CardDescription>
                    We've analyzed your resume to help you optimize it for job applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border p-4">
                    <h3 className="text-lg font-medium mb-3">Key Insights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-600">Strengths</p>
                        <ul className="mt-2 text-sm space-y-1">
                          <li>• Strong experience section</li>
                          <li>• Good use of action verbs</li>
                          <li>• Clear contact information</li>
                        </ul>
                      </div>
                      <div className="flex flex-col p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium text-yellow-600">Suggestions</p>
                        <ul className="mt-2 text-sm space-y-1">
                          <li>• Add more measurable achievements</li>
                          <li>• Consider including certifications</li>
                          <li>• Update skills section</li>
                        </ul>
                      </div>
                      <div className="flex flex-col p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-600">Industry Match</p>
                        <ul className="mt-2 text-sm space-y-1">
                          <li>• Technology: 85% match</li>
                          <li>• Marketing: 65% match</li>
                          <li>• Finance: 45% match</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Build Resume Tab */}
          <TabsContent value="build">
            <ResumeBuilderForm
              onComplete={handleResumeBuilderComplete}
              initialData={resumeData || undefined}
            />
          </TabsContent>
          
          {/* Upload Resume Tab */}
          <TabsContent value="upload">
            <ResumeUpload onUploadComplete={handleResumeUploadComplete} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}