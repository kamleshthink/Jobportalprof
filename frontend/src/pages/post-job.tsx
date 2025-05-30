import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { postJob } from "@/utils/api";

enum PostJobStep {
  DETAILS = 1,
  DESCRIPTION = 2,
  QUALIFICATIONS = 3,
  PREFERENCES = 4,
  PAYMENT = 5,
  SPONSOR = 6,
  PRE_SCREEN = 7,
  REVIEW = 8,
}

const JobPostPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<PostJobStep>(PostJobStep.DETAILS);
  const [jobPostData, setJobPostData] = useState<any>({
    jobType: ["Full-time"],
    schedule: [],
    payType: "Range",
    sponsorPlan: "Basic",
    skills: [],
    benefits: [],
    supplementalPay: [],
    screeningQuestions: [],
    showCompanyDetails: true,
    remote: false,
    featured: false
  });

  const form = useForm({
    defaultValues: {
      title: "",
      company: user?.company || "",
      location: "",
      type: "Full-time",
      workMode: "on-site",
      description: "",
      requirements: "",
      experience: "mid-level",
      minSalary: 0,
      maxSalary: 0,
      salaryPeriod: "monthly",
      benefits: [],
      skills: [],
      payType: "Range",
      deductTDS: false,
      screening: [],
      applicationDeadline: false,
      // Add missing fields that were causing validation errors
      numberOfOpenings: "1",
      recruitmentTimeline: "1-2 weeks",
      additionalQualifications: "",
      contactEmail: user?.email || "",
      otherSupplementalPay: "",
      startDate: "",
    }
  });

  const postJobMutation = useMutation({
    mutationFn: (data: any) => postJob(data),
    onSuccess: () => {
      toast({
        title: "Job Posted",
        description: "Your job has been posted successfully.",
      });
      setLocation("/employer/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred while posting the job.",
        variant: "destructive",
      });
    }
  });

  const handleNextStep = (data: any) => {
    // Update the job post data with the form data from the current step
    setJobPostData((prev: any) => ({ ...prev, ...data }));
    
    if (currentStep < PostJobStep.REVIEW) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the job post
      postJobMutation.mutate(jobPostData);
    }
  };

  const handleBackStep = () => {
    if (currentStep > PostJobStep.DETAILS) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < PostJobStep.REVIEW) {
      setCurrentStep(currentStep + 1);
    }
  };

  const jobTypes = [
    { value: "Full-time", label: "Full-time" },
    { value: "Part-time", label: "Part-time" },
    { value: "Contract", label: "Contract" },
    { value: "Internship", label: "Internship" },
    { value: "Temporary", label: "Temporary" },
    { value: "Volunteer", label: "Volunteer" },
  ];

  const scheduleOptions = [
    { value: "Day shift", label: "Day shift" },
    { value: "Morning shift", label: "Morning shift" },
    { value: "Rotational shift", label: "Rotational shift" },
    { value: "Night shift", label: "Night shift" },
    { value: "Monday to Friday", label: "Monday to Friday" },
    { value: "Evening shift", label: "Evening shift" },
    { value: "Weekend availability", label: "Weekend availability" },
    { value: "Fixed shift", label: "Fixed shift" },
    { value: "US shift", label: "US shift" },
    { value: "UK shift", label: "UK shift" },
    { value: "Weekend only", label: "Weekend only" },
    { value: "Other", label: "Other" },
  ];

  const benefitOptions = [
    { value: "Health insurance", label: "Health insurance" },
    { value: "Provident Fund", label: "Provident Fund" },
    { value: "Cell phone reimbursement", label: "Cell phone reimbursement" },
    { value: "Paid sick time", label: "Paid sick time" },
    { value: "Work from home", label: "Work from home" },
    { value: "Flexible schedule", label: "Flexible schedule" },
    { value: "Food provided", label: "Food provided" },
  ];

  const supplementalPayOptions = [
    { value: "Performance bonus", label: "Performance bonus" },
    { value: "Yearly bonus", label: "Yearly bonus" },
    { value: "Commission pay", label: "Commission pay" },
    { value: "Overtime pay", label: "Overtime pay" },
    { value: "Quarterly bonus", label: "Quarterly bonus" },
    { value: "Shift allowance", label: "Shift allowance" },
    { value: "Joining bonus", label: "Joining bonus" },
    { value: "Other", label: "Other" },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case PostJobStep.DETAILS:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img src="/assets/job-details-illustration.png" alt="Job Details" className="w-24 h-24" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Add job details</h1>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleNextStep)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} required placeholder="e.g. Software Engineer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} required placeholder="e.g. Acme Corp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} required placeholder="e.g. New York, NY" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Job type <span className="text-red-500">*</span></h3>
                    <div className="flex flex-wrap gap-2">
                      {jobTypes.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant={jobPostData.jobType.includes(type.value) ? "default" : "outline"}
                          className={`rounded-full ${
                            jobPostData.jobType.includes(type.value) ? "bg-primary text-white" : ""
                          }`}
                          onClick={() => {
                            const newJobType = [...jobPostData.jobType];
                            if (newJobType.includes(type.value)) {
                              // Only remove if it's not the last one
                              if (newJobType.length > 1) {
                                setJobPostData({
                                  ...jobPostData,
                                  jobType: newJobType.filter(t => t !== type.value)
                                });
                              }
                            } else {
                              setJobPostData({
                                ...jobPostData,
                                jobType: [...newJobType, type.value]
                              });
                            }
                          }}
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Schedule</h3>
                    <div className="flex flex-wrap gap-2">
                      {scheduleOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={jobPostData.schedule.includes(option.value) ? "default" : "outline"}
                          className={`rounded-full ${
                            jobPostData.schedule.includes(option.value) ? "bg-primary text-white" : ""
                          }`}
                          onClick={() => {
                            const newSchedule = [...jobPostData.schedule];
                            if (newSchedule.includes(option.value)) {
                              setJobPostData({
                                ...jobPostData,
                                schedule: newSchedule.filter(s => s !== option.value)
                              });
                            } else {
                              setJobPostData({
                                ...jobPostData,
                                schedule: [...newSchedule, option.value]
                              });
                            }
                          }}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Is there a planned start date for this job?</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="start-date-yes"
                          name="start-date"
                          checked={jobPostData.hasStartDate === true}
                          onChange={() => setJobPostData({ ...jobPostData, hasStartDate: true })}
                        />
                        <label htmlFor="start-date-yes">Yes</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="start-date-no"
                          name="start-date"
                          checked={jobPostData.hasStartDate === false}
                          onChange={() => setJobPostData({ ...jobPostData, hasStartDate: false })}
                        />
                        <label htmlFor="start-date-no">No</label>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="numberOfOpenings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of people you wish to hire for this job <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recruitmentTimeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recruitment timeline for this job <span className="text-red-500">*</span></FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-3 days">1-3 days</SelectItem>
                            <SelectItem value="3-7 days">3-7 days</SelectItem>
                            <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                            <SelectItem value="2-4 weeks">2-4 weeks</SelectItem>
                            <SelectItem value="More than a month">More than a month</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="min-w-[120px]">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );

      case PostJobStep.DESCRIPTION:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img src="/assets/job-description-illustration.png" alt="Job Description" className="w-24 h-24" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Describe the job</h1>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleNextStep)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job description <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={10}
                          placeholder="Describe the responsibilities, day-to-day activities, and requirements for this role."
                          className="min-h-[200px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBackStep}>
                    Back
                  </Button>
                  <Button type="submit">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );

      case PostJobStep.QUALIFICATIONS:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img src="/assets/qualifications-illustration.png" alt="Qualifications" className="w-24 h-24" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Qualifications for your job</h1>
                <p className="text-sm text-gray-500">
                  Based on your job description, we've identified qualifications commonly needed for your job.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                {/* Suggested skills */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Suggested Skills</h3>
                  </div>
                  <div className="space-y-2">
                    {["JavaScript", "React", "Node.js", "TypeScript", "MongoDB"].map((skill) => (
                      <div key={skill} className="flex justify-between items-center p-2 border-b">
                        <div>
                          <div className="font-medium">{skill}</div>
                          <div className="text-xs text-gray-500">Skill</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <Checkbox
                              id={`preferred-${skill}`}
                              checked={jobPostData.preferredSkills?.includes(skill)}
                              onCheckedChange={(checked) => {
                                const newPreferred = [...(jobPostData.preferredSkills || [])];
                                if (checked) {
                                  if (!newPreferred.includes(skill)) {
                                    newPreferred.push(skill);
                                  }
                                } else {
                                  const index = newPreferred.indexOf(skill);
                                  if (index !== -1) {
                                    newPreferred.splice(index, 1);
                                  }
                                }
                                setJobPostData({
                                  ...jobPostData,
                                  preferredSkills: newPreferred
                                });
                              }}
                              className="mr-2"
                            />
                            <label htmlFor={`preferred-${skill}`} className="text-sm">Preferred</label>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() => {
                              const newRequiredSkills = [...(jobPostData.requiredSkills || [])];
                              if (!newRequiredSkills.includes(skill)) {
                                newRequiredSkills.push(skill);
                                setJobPostData({
                                  ...jobPostData,
                                  requiredSkills: newRequiredSkills
                                });
                              }
                            }}
                          >
                            Add to job
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2"
                            onClick={() => {
                              // Remove skill from both required and preferred
                              const newRequired = [...(jobPostData.requiredSkills || [])];
                              const reqIndex = newRequired.indexOf(skill);
                              if (reqIndex !== -1) {
                                newRequired.splice(reqIndex, 1);
                              }

                              const newPreferred = [...(jobPostData.preferredSkills || [])];
                              const prefIndex = newPreferred.indexOf(skill);
                              if (prefIndex !== -1) {
                                newPreferred.splice(prefIndex, 1);
                              }

                              setJobPostData({
                                ...jobPostData,
                                requiredSkills: newRequired,
                                preferredSkills: newPreferred
                              });
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <FormField
                    control={form.control}
                    name="additionalQualifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What else are you looking for in a candidate?</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Add any other qualifications or skills" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={handleBackStep}>
                  Skip
                </Button>
                <Button
                  type="button"
                  onClick={() => handleNextStep(form.getValues())}
                >
                  Save and continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case PostJobStep.PREFERENCES:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img src="/assets/preferences-illustration.png" alt="Preferences" className="w-24 h-24" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Set preferences</h1>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleNextStep)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Communication preferences</h3>
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Send daily updates to <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Email address" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="mt-2">
                      <Button type="button" variant="outline" size="sm">
                        + Add email
                      </Button>
                    </div>
                    <div className="mt-4">
                      <Checkbox
                        id="email-updates"
                        checked={jobPostData.sendEmailUpdates}
                        onCheckedChange={(checked) => 
                          setJobPostData({ ...jobPostData, sendEmailUpdates: checked })
                        }
                      />
                      <label htmlFor="email-updates" className="ml-2 text-sm">
                        Yes, send an individual email update each time someone applies.
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm font-medium mb-2">Application preferences</h3>
                    <div className="space-y-2">
                      <div>
                        <Checkbox
                          id="resume-required"
                          checked={jobPostData.resumeRequired}
                          onCheckedChange={(checked) => 
                            setJobPostData({ ...jobPostData, resumeRequired: checked })
                          }
                        />
                        <label htmlFor="resume-required" className="ml-2 text-sm">
                          Resume is required
                        </label>
                      </div>
                      <div>
                        <Checkbox
                          id="allow-contact"
                          checked={jobPostData.allowContact}
                          onCheckedChange={(checked) => 
                            setJobPostData({ ...jobPostData, allowContact: checked })
                          }
                        />
                        <label htmlFor="allow-contact" className="ml-2 text-sm">
                          Let potential candidates contact you about this job by email to the address provided
                        </label>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Is there an application deadline?</h3>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="deadline-no"
                            name="application-deadline"
                            checked={!jobPostData.hasDeadline}
                            onChange={() => setJobPostData({ ...jobPostData, hasDeadline: false })}
                          />
                          <label htmlFor="deadline-no">No</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            id="deadline-yes"
                            name="application-deadline"
                            checked={jobPostData.hasDeadline === true}
                            onChange={() => setJobPostData({ ...jobPostData, hasDeadline: true })}
                          />
                          <label htmlFor="deadline-yes">Yes</label>
                        </div>
                      </div>
                      
                      {jobPostData.hasDeadline && (
                        <div className="mt-2">
                          <FormField
                            control={form.control}
                            name="applicationDeadline"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBackStep}>
                    Back
                  </Button>
                  <Button type="submit">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );

      case PostJobStep.PAYMENT:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img src="/assets/payment-illustration.png" alt="Payment" className="w-24 h-24" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Add pay and benefits</h1>
                <p className="text-sm text-gray-500">
                  Help attract the right candidates by including competitive compensation
                </p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleNextStep)} className="space-y-6">
                <div className="space-y-6">
                  {/* Pay section */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="text-base font-medium mb-2">Pay</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Review the pay we estimated for your job and adjust it as needed. Check your local minimum wage.
                    </p>
                    
                    <div className="mb-4">
                      <FormField
                        control={form.control}
                        name="payType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Show pay by</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setJobPostData({ ...jobPostData, payType: value });
                              }}
                              defaultValue={jobPostData.payType}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pay type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Range">Range</SelectItem>
                                <SelectItem value="Starting">Starting salary</SelectItem>
                                <SelectItem value="Maximum">Maximum salary</SelectItem>
                                <SelectItem value="Exact">Exact amount</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(jobPostData.payType === "Range" || jobPostData.payType === "Starting" || 
                        jobPostData.payType === "Maximum" || jobPostData.payType === "Exact") && (
                        <div>
                          <FormField
                            control={form.control}
                            name="minSalary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {jobPostData.payType === "Exact" ? "Amount" : 
                                    jobPostData.payType === "Starting" ? "Starting" : 
                                    jobPostData.payType === "Maximum" ? "Maximum" : "Minimum"}
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                                    <Input {...field} type="number" className="pl-6" placeholder="15,000" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      {jobPostData.payType === "Range" && (
                        <div>
                          <FormField
                            control={form.control}
                            name="maxSalary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maximum</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                                    <Input {...field} type="number" className="pl-6" placeholder="25,000" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      
                      <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <FormField
                          control={form.control}
                          name="salaryPeriod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rate</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select rate" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="hourly">per hour</SelectItem>
                                  <SelectItem value="daily">per day</SelectItem>
                                  <SelectItem value="weekly">per week</SelectItem>
                                  <SelectItem value="monthly">per month</SelectItem>
                                  <SelectItem value="yearly">per year</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <Checkbox 
                        id="negotiate" 
                        checked={jobPostData.negotiable} 
                        onCheckedChange={(checked) => 
                          setJobPostData({ ...jobPostData, negotiable: !!checked })
                        }
                      />
                      <label htmlFor="negotiate" className="text-sm">Salary negotiable</label>
                    </div>
                  </div>
                  
                  {/* Supplemental Pay section */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="text-base font-medium mb-4">Supplemental Pay</h3>
                    <div className="flex flex-wrap gap-2">
                      {supplementalPayOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={jobPostData.supplementalPay?.includes(option.value) ? "default" : "outline"}
                          className={`rounded-full ${
                            jobPostData.supplementalPay?.includes(option.value) ? "bg-primary text-white" : ""
                          }`}
                          onClick={() => {
                            const newSupplementalPay = [...(jobPostData.supplementalPay || [])];
                            if (newSupplementalPay.includes(option.value)) {
                              setJobPostData({
                                ...jobPostData,
                                supplementalPay: newSupplementalPay.filter(s => s !== option.value)
                              });
                            } else {
                              setJobPostData({
                                ...jobPostData,
                                supplementalPay: [...newSupplementalPay, option.value]
                              });
                            }
                          }}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Show input if "Other" is selected */}
                    {jobPostData.supplementalPay?.includes("Other") && (
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name="otherSupplementalPay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Please specify other supplemental pay</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="e.g., Holiday bonuses, Fuel allowance, etc."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Benefits section */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="text-base font-medium mb-4">Benefits</h3>
                    <div className="flex flex-wrap gap-2">
                      {benefitOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={jobPostData.benefits?.includes(option.value) ? "default" : "outline"}
                          className={`rounded-full ${
                            jobPostData.benefits?.includes(option.value) ? "bg-primary text-white" : ""
                          }`}
                          onClick={() => {
                            const newBenefits = [...(jobPostData.benefits || [])];
                            if (newBenefits.includes(option.value)) {
                              setJobPostData({
                                ...jobPostData,
                                benefits: newBenefits.filter(b => b !== option.value)
                              });
                            } else {
                              setJobPostData({
                                ...jobPostData,
                                benefits: [...newBenefits, option.value]
                              });
                            }
                          }}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Show more benefits toggle */}
                    <Button 
                      type="button" 
                      variant="link" 
                      className="mt-2 text-sm p-0"
                      onClick={() => setJobPostData({
                        ...jobPostData,
                        showMoreBenefits: !jobPostData.showMoreBenefits
                      })}
                    >
                      {jobPostData.showMoreBenefits ? "Show fewer" : "Show 8 more..."}
                    </Button>
                    
                    {/* Additional benefits shown when expanded */}
                    {jobPostData.showMoreBenefits && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          "Dental insurance",
                          "Vision insurance", 
                          "Employee discount",
                          "Parental leave",
                          "Company car", 
                          "Gym membership",
                          "Tuition reimbursement",
                          "Life insurance"
                        ].map((benefit) => (
                          <div key={benefit} className="flex items-center gap-2">
                            <Checkbox 
                              id={`benefit-${benefit.replace(/\s+/g, '-').toLowerCase()}`}
                              checked={jobPostData.additionalBenefits?.includes(benefit)}
                              onCheckedChange={(checked) => {
                                const additionalBenefits = [...(jobPostData.additionalBenefits || [])];
                                if (checked) {
                                  setJobPostData({
                                    ...jobPostData,
                                    additionalBenefits: [...additionalBenefits, benefit]
                                  });
                                } else {
                                  setJobPostData({
                                    ...jobPostData,
                                    additionalBenefits: additionalBenefits.filter(b => b !== benefit)
                                  });
                                }
                              }}
                            />
                            <label 
                              htmlFor={`benefit-${benefit.replace(/\s+/g, '-').toLowerCase()}`}
                              className="text-sm"
                            >
                              {benefit}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBackStep}>
                    Back
                  </Button>
                  <Button type="submit">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );

      case PostJobStep.SPONSOR:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img src="/assets/sponsor-illustration.png" alt="Sponsor Job" className="w-24 h-24" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sponsor job</h1>
                <p className="text-sm text-gray-500">
                  Choosing the recommended budget makes your listing get better visibility and show up more often in search results, making it easier for people looking for a job like yours to apply.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Ad duration</h3>
                <p className="text-xs text-gray-500">For how long do you want your job to be visible on websites?</p>
                <Select
                  value={jobPostData.adDuration || "30 days"}
                  onValueChange={(value) => setJobPostData({ ...jobPostData, adDuration: value })}
                >
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Select ad duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7 days">7 days</SelectItem>
                    <SelectItem value="14 days">14 days</SelectItem>
                    <SelectItem value="30 days">30 days</SelectItem>
                    <SelectItem value="60 days">60 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Ad budget</h3>
                <p className="text-xs text-gray-500">We recommend setting ₹2,000 to promote your job posting</p>
                <div className="mt-2 flex items-center gap-4">
                  <span>₹</span>
                  <Input
                    type="number"
                    placeholder="2000"
                    value={jobPostData.adBudget || ""}
                    onChange={(e) => setJobPostData({ ...jobPostData, adBudget: e.target.value })}
                  />
                  <span>daily average</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Daily spend may fluctuate based on your post's activity, but you will spend ₹4,800.00 daily max.
                </p>
                <p className="text-xs text-gray-500">
                  You can change the amount, pause, or close your job at any time.
                </p>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium">Looks like you need to hire fast</h3>
                <p className="text-xs text-gray-500 mt-1">
                  You can add an urgently hiring label to your Sponsored Job at no additional charge.
                </p>
                <div className="mt-2">
                  <Checkbox
                    id="urgent-label"
                    checked={jobPostData.urgentLabel}
                    onCheckedChange={(checked) => 
                      setJobPostData({ ...jobPostData, urgentLabel: checked })
                    }
                  />
                  <label htmlFor="urgent-label" className="ml-2 text-sm">
                    Add label
                  </label>
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <Button variant="link" onClick={handleBackStep}>
                  No thanks
                </Button>
                <Button 
                  onClick={() => handleNextStep(form.getValues())}
                  className="bg-primary hover:bg-primary-600"
                >
                  Save and continue
                </Button>
              </div>
            </div>
          </div>
        );

      case PostJobStep.PRE_SCREEN:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img src="/assets/prescreen-illustration.png" alt="Pre-screen Applicants" className="w-24 h-24" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Pre-screen applicants</h1>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-12 h-12 bg-purple-200 rounded-md flex items-center justify-center">
                    <span className="text-purple-700 font-bold">?</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Have to have it? Make it a deal breaker.</h3>
                    <p className="text-xs text-gray-600">
                      We won't notify you of candidates who don't meet your deal breaker 
                      qualification questions. You can review them anytime on your candidate list.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm">Screening question: Please list 2-3 dates and time ranges that you could do an interview.</p>
                  <button type="button" className="text-gray-400">×</button>
                </div>
                <p className="text-xs text-gray-500">Ask applicants to list some dates and times they could do an interview.</p>
              </div>

              <div>
                <Button variant="outline" className="w-full justify-start">
                  Browse more questions
                </Button>
              </div>

              <div className="pt-6 flex justify-between">
                <Button variant="ghost" onClick={handleBackStep}>
                  Back
                </Button>
                <Button 
                  variant="default" 
                  className="bg-primary hover:bg-primary-600"
                  onClick={() => {
                    const data = form.getValues();
                    handleNextStep({
                      ...data,
                      screeningQuestions: [
                        "Please list 2-3 dates and time ranges that you could do an interview."
                      ]
                    });
                  }}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case PostJobStep.REVIEW:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img src="/assets/review-illustration.png" alt="Review" className="w-24 h-24" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Review</h1>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border rounded-lg overflow-hidden">
                <h2 className="text-lg font-medium p-4 bg-gray-50">Job details</h2>
                <div className="p-4 divide-y">
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Job title</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{form.getValues().title || jobPostData.title}</p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Company for this job</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{form.getValues().company || jobPostData.company}</p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Number of openings</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{form.getValues().numberOfOpenings || "1"}</p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Country and language</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">India<br/>English</p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Location</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{form.getValues().location || jobPostData.location}</p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Job type</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {jobPostData.jobType?.join(', ') || form.getValues().type}
                      </p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Schedule</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {jobPostData.schedule?.join(', ') || "Not specified"}
                      </p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Pay</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {jobPostData.payType === "Range" 
                          ? `₹${form.getValues().minSalary || 0} - ₹${form.getValues().maxSalary || 0} per ${form.getValues().salaryPeriod || 'month'}`
                          : `₹${form.getValues().minSalary || 0} per ${form.getValues().salaryPeriod || 'month'}`}
                      </p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Supplemental Pay</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {jobPostData.supplementalPay?.join(', ') || "Not specified"}
                      </p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Benefits</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {jobPostData.benefits?.join(', ') || "Not specified"}
                      </p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-2 flex justify-between">
                    <p className="text-sm text-gray-600">Job description</p>
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h2 className="text-lg font-medium mb-2">Settings</h2>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Application method</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">Email</p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Application updates</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{form.getValues().contactEmail || user?.email}</p>
                      <button type="button" className="text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <Button variant="ghost" onClick={handleBackStep}>
                  Back
                </Button>
                <Button 
                  variant="default" 
                  className="bg-primary hover:bg-primary-600"
                  onClick={() => handleNextStep(form.getValues())}
                  disabled={postJobMutation.isPending}
                >
                  {postJobMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting Job...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Post Job
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">You need to sign in to post a job</h1>
        <Link href="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (user.role !== 'employer' && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Only employers can post jobs</h1>
        <p className="text-gray-600 mb-4">
          If you're a job seeker, you can apply to jobs but not post them.
        </p>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 sm:p-8">
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobPostPage;