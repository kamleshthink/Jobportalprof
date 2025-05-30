import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import JobListings from "@/pages/job-listings";
import JobDetails from "@/pages/job-details";
import JobPostPage from "@/pages/job-post";
import ProfilePage from "@/pages/profile";
import JobSeekerDashboard from "@/pages/dashboard/job-seeker";
import EmployerDashboard from "@/pages/dashboard/employer";
import AdminDashboard from "@/pages/dashboard/admin";
import Companies from "@/pages/companies";
import CompanyDetails from "@/pages/company-details";
import Services from "@/pages/services";
import ResumeManagement from "@/pages/resume-management";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import Navbar from "./components/layout/navbar";
import Footer from "./components/layout/footer";
import Chatbot from "./components/chatbot/chatbot";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/jobs" component={JobListings} />
          <Route path="/jobs/:id" component={JobDetails} />
          <Route path="/companies" component={Companies} />
          <Route path="/companies/:id" component={CompanyDetails} />
          <Route path="/services" component={Services} />
          
          <ProtectedRoute path="/dashboard" component={JobSeekerDashboard} />
          <ProtectedRoute path="/employer/dashboard" component={EmployerDashboard} />
          <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
          <ProtectedRoute path="/post-job" component={JobPostPage} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <ProtectedRoute path="/resume" component={ResumeManagement} />
          
          <Route component={NotFound} />
        </Switch>
      </div>
      
      <Footer />
      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
