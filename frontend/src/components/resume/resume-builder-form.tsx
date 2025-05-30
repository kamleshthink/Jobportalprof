import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { ResumeData } from '@shared/mongodb-types';

// Form schema
const resumeSchema = z.object({
  personalInfo: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    address: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
  }),
  summary: z.string().optional(),
  education: z.array(z.object({
    institution: z.string().min(1, 'Institution name is required'),
    degree: z.string().min(1, 'Degree is required'),
    fieldOfStudy: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    description: z.string().optional(),
  })).min(1, 'At least one education entry is required'),
  experience: z.array(z.object({
    company: z.string().min(1, 'Company name is required'),
    jobTitle: z.string().min(1, 'Job title is required'),
    location: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    description: z.string().min(1, 'Job description is required'),
  })),
  skills: z.array(z.string()).min(1, 'At least one skill is required').max(10, 'Maximum 10 skills allowed'),
  certifications: z.array(z.object({
    name: z.string().min(1, 'Certification name is required'),
    issuer: z.string().optional(),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
    credentialID: z.string().optional(),
  })).optional(),
  languages: z.array(z.object({
    language: z.string().min(1, 'Language name is required'),
    proficiency: z.enum(['Basic', 'Conversational', 'Proficient', 'Fluent', 'Native']),
  })).optional(),
});

type FormValues = z.infer<typeof resumeSchema>;

interface ResumeBuilderFormProps {
  onComplete: (resumeData: ResumeData) => void;
  initialData?: Partial<ResumeData>;
}

export function ResumeBuilderForm({ onComplete, initialData }: ResumeBuilderFormProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Default values
  const defaultValues: FormValues = {
    personalInfo: initialData?.personalInfo || {
      name: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      website: '',
    },
    summary: initialData?.summary || '',
    education: initialData?.education?.length ? initialData.education : [
      { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', description: '' }
    ],
    experience: initialData?.experience?.length ? initialData.experience : [
      { company: '', jobTitle: '', location: '', startDate: '', endDate: '', description: '' }
    ],
    skills: initialData?.skills || [],
    certifications: initialData?.certifications || [],
    languages: initialData?.languages || [],
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(resumeSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control: form.control,
    name: 'education',
  });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
    control: form.control,
    name: 'experience',
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control: form.control,
    name: 'skills',
  });

  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({
    control: form.control,
    name: 'certifications',
  });

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control: form.control,
    name: 'languages',
  });

  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim() && skillFields.length < 10) {
      appendSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/users/resume/build', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save resume');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Resume Saved',
        description: 'Your resume has been successfully created.',
      });
      
      onComplete(data);
    } catch (error) {
      toast({
        title: 'Error Saving Resume',
        description: error.message || 'There was an error saving your resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextTab = () => {
    if (activeTab === 'personal') setActiveTab('education');
    else if (activeTab === 'education') setActiveTab('experience');
    else if (activeTab === 'experience') setActiveTab('skills');
    else if (activeTab === 'skills') setActiveTab('additional');
  };

  const prevTab = () => {
    if (activeTab === 'education') setActiveTab('personal');
    else if (activeTab === 'experience') setActiveTab('education');
    else if (activeTab === 'skills') setActiveTab('experience');
    else if (activeTab === 'additional') setActiveTab('skills');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resume Builder</CardTitle>
        <CardDescription>Create a professional resume that gets you noticed by employers.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    {...form.register('personalInfo.name')}
                    placeholder="John Doe"
                  />
                  {form.formState.errors.personalInfo?.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.personalInfo.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('personalInfo.email')}
                    placeholder="john.doe@example.com"
                  />
                  {form.formState.errors.personalInfo?.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.personalInfo.email.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    {...form.register('personalInfo.phone')}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Location</Label>
                  <Input
                    id="address"
                    {...form.register('personalInfo.address')}
                    placeholder="City, State, Country"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    {...form.register('personalInfo.linkedin')}
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website/Portfolio</Label>
                  <Input
                    id="website"
                    {...form.register('personalInfo.website')}
                    placeholder="https://johndoe.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  {...form.register('summary')}
                  placeholder="A brief summary of your professional background and career goals."
                  rows={4}
                />
              </div>
            </div>
          </TabsContent>

          {/* Education */}
          <TabsContent value="education">
            <div className="space-y-4">
              {educationFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Education #{index + 1}</h3>
                    {educationFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`education.${index}.institution`}>Institution <span className="text-red-500">*</span></Label>
                      <Input
                        id={`education.${index}.institution`}
                        {...form.register(`education.${index}.institution`)}
                        placeholder="University/College Name"
                      />
                      {form.formState.errors.education?.[index]?.institution && (
                        <p className="text-sm text-red-500">{form.formState.errors.education[index].institution.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`education.${index}.degree`}>Degree/Certificate <span className="text-red-500">*</span></Label>
                      <Input
                        id={`education.${index}.degree`}
                        {...form.register(`education.${index}.degree`)}
                        placeholder="Bachelor of Science"
                      />
                      {form.formState.errors.education?.[index]?.degree && (
                        <p className="text-sm text-red-500">{form.formState.errors.education[index].degree.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`education.${index}.fieldOfStudy`}>Field of Study</Label>
                      <Input
                        id={`education.${index}.fieldOfStudy`}
                        {...form.register(`education.${index}.fieldOfStudy`)}
                        placeholder="Computer Science"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`education.${index}.startDate`}>Start Date <span className="text-red-500">*</span></Label>
                        <Input
                          id={`education.${index}.startDate`}
                          {...form.register(`education.${index}.startDate`)}
                          placeholder="MM/YYYY"
                        />
                        {form.formState.errors.education?.[index]?.startDate && (
                          <p className="text-sm text-red-500">{form.formState.errors.education[index].startDate.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`education.${index}.endDate`}>End Date</Label>
                        <Input
                          id={`education.${index}.endDate`}
                          {...form.register(`education.${index}.endDate`)}
                          placeholder="MM/YYYY or 'Present'"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor={`education.${index}.description`}>Description</Label>
                    <Textarea
                      id={`education.${index}.description`}
                      {...form.register(`education.${index}.description`)}
                      placeholder="Courses, achievements, activities, etc."
                      rows={3}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => appendEducation({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', description: '' })}
                disabled={educationFields.length >= 5}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Education
              </Button>
              {educationFields.length >= 5 && (
                <p className="text-sm text-gray-500 mt-2">Maximum 5 education entries allowed.</p>
              )}
            </div>
          </TabsContent>

          {/* Work Experience */}
          <TabsContent value="experience">
            <div className="space-y-4">
              {experienceFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Experience #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`experience.${index}.jobTitle`}>Job Title <span className="text-red-500">*</span></Label>
                      <Input
                        id={`experience.${index}.jobTitle`}
                        {...form.register(`experience.${index}.jobTitle`)}
                        placeholder="Software Engineer"
                      />
                      {form.formState.errors.experience?.[index]?.jobTitle && (
                        <p className="text-sm text-red-500">{form.formState.errors.experience[index].jobTitle.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`experience.${index}.company`}>Company <span className="text-red-500">*</span></Label>
                      <Input
                        id={`experience.${index}.company`}
                        {...form.register(`experience.${index}.company`)}
                        placeholder="Company Name"
                      />
                      {form.formState.errors.experience?.[index]?.company && (
                        <p className="text-sm text-red-500">{form.formState.errors.experience[index].company.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`experience.${index}.location`}>Location</Label>
                      <Input
                        id={`experience.${index}.location`}
                        {...form.register(`experience.${index}.location`)}
                        placeholder="City, State, Country"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`experience.${index}.startDate`}>Start Date <span className="text-red-500">*</span></Label>
                        <Input
                          id={`experience.${index}.startDate`}
                          {...form.register(`experience.${index}.startDate`)}
                          placeholder="MM/YYYY"
                        />
                        {form.formState.errors.experience?.[index]?.startDate && (
                          <p className="text-sm text-red-500">{form.formState.errors.experience[index].startDate.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`experience.${index}.endDate`}>End Date</Label>
                        <Input
                          id={`experience.${index}.endDate`}
                          {...form.register(`experience.${index}.endDate`)}
                          placeholder="MM/YYYY or 'Present'"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor={`experience.${index}.description`}>Job Description <span className="text-red-500">*</span></Label>
                    <Textarea
                      id={`experience.${index}.description`}
                      {...form.register(`experience.${index}.description`)}
                      placeholder="Describe your responsibilities, achievements, and key skills used. Use bullet points for better readability."
                      rows={4}
                    />
                    {form.formState.errors.experience?.[index]?.description && (
                      <p className="text-sm text-red-500">{form.formState.errors.experience[index].description.message}</p>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => appendExperience({ company: '', jobTitle: '', location: '', startDate: '', endDate: '', description: '' })}
                disabled={experienceFields.length >= 10}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Experience
              </Button>
              {experienceFields.length >= 10 && (
                <p className="text-sm text-gray-500 mt-2">Maximum 10 experience entries allowed.</p>
              )}
            </div>
          </TabsContent>

          {/* Skills */}
          <TabsContent value="skills">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-skill">Add Skills <span className="text-red-500">*</span> (max 10)</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="e.g. JavaScript, Project Management, etc."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={!newSkill.trim() || skillFields.length >= 10}
                  >
                    Add
                  </Button>
                </div>
                {skillFields.length === 0 && (
                  <p className="text-sm text-red-500">At least one skill is required</p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {skillFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                  >
                    <span className="mr-2">{form.getValues(`skills.${index}`)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 rounded-full"
                      onClick={() => removeSkill(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-500">Tips for adding skills:</p>
                <ul className="list-disc list-inside text-sm text-gray-500 ml-4 mt-2">
                  <li>Add both technical skills (e.g., programming languages) and soft skills (e.g., teamwork)</li>
                  <li>Focus on skills that are relevant to the jobs you're applying for</li>
                  <li>Be specific and avoid generic skills that everyone claims to have</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Additional Information */}
          <TabsContent value="additional">
            <div className="space-y-6">
              {/* Certifications */}
              <div>
                <h3 className="text-lg font-medium mb-4">Certifications</h3>
                <div className="space-y-4">
                  {certificationFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Certification #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`certifications.${index}.name`}>Certification Name <span className="text-red-500">*</span></Label>
                          <Input
                            id={`certifications.${index}.name`}
                            {...form.register(`certifications.${index}.name`)}
                            placeholder="AWS Certified Solutions Architect"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`certifications.${index}.issuer`}>Issuing Organization</Label>
                          <Input
                            id={`certifications.${index}.issuer`}
                            {...form.register(`certifications.${index}.issuer`)}
                            placeholder="Amazon Web Services"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor={`certifications.${index}.issueDate`}>Issue Date</Label>
                          <Input
                            id={`certifications.${index}.issueDate`}
                            {...form.register(`certifications.${index}.issueDate`)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`certifications.${index}.expiryDate`}>Expiry Date</Label>
                          <Input
                            id={`certifications.${index}.expiryDate`}
                            {...form.register(`certifications.${index}.expiryDate`)}
                            placeholder="MM/YYYY or 'No Expiration'"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor={`certifications.${index}.credentialID`}>Credential ID</Label>
                        <Input
                          id={`certifications.${index}.credentialID`}
                          {...form.register(`certifications.${index}.credentialID`)}
                          placeholder="Certification ID or URL"
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendCertification({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialID: '' })}
                    disabled={certificationFields.length >= 5}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Certification
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Languages */}
              <div>
                <h3 className="text-lg font-medium mb-4">Languages</h3>
                <div className="space-y-4">
                  {languageFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Language #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLanguage(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`languages.${index}.language`}>Language <span className="text-red-500">*</span></Label>
                          <Input
                            id={`languages.${index}.language`}
                            {...form.register(`languages.${index}.language`)}
                            placeholder="English, Spanish, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`languages.${index}.proficiency`}>Proficiency Level</Label>
                          <select
                            id={`languages.${index}.proficiency`}
                            {...form.register(`languages.${index}.proficiency`)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="Basic">Basic</option>
                            <option value="Conversational">Conversational</option>
                            <option value="Proficient">Proficient</option>
                            <option value="Fluent">Fluent</option>
                            <option value="Native">Native</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendLanguage({ language: '', proficiency: 'Proficient' })}
                    disabled={languageFields.length >= 5}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Language
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={prevTab}
            disabled={activeTab === 'personal'}
          >
            Previous
          </Button>
          {activeTab !== 'additional' ? (
            <Button type="button" onClick={nextTab}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={form.handleSubmit(handleSubmit)} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                </>
              ) : 'Complete Resume'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}