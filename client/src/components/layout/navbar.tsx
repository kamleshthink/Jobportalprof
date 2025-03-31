import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Bell,
  ChevronDown,
  Menu,
  Briefcase,
  User,
  LayoutDashboard,
  LogOut,
  Building,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [currentPath] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-10">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="flex items-center">
                <svg viewBox="0 0 32 32" className="h-8 w-8 text-blue-600" fill="currentColor">
                  <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3zm0 24.1c-6.1 0-11.1-5-11.1-11.1S9.9 4.9 16 4.9s11.1 5 11.1 11.1-5 11.1-11.1 11.1z"/>
                  <path d="M16 8.7c-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9-1.3-2.9-2.9-2.9zM16 17.4c-2.9 0-5.4 1.5-6.9 3.8-.3.5-.1 1.1.4 1.4s1.1.1 1.4-.4c1.1-1.7 3-2.8 5.1-2.8s4 1.1 5.1 2.8c.2.3.5.5.9.5.2 0 .3 0 .5-.1.5-.3.7-.9.4-1.4-1.5-2.3-4-3.8-6.9-3.8z"/>
                </svg>
                <span className="ml-2 font-bold text-xl text-blue-600">naukri</span>
              </div>
            </Link>
            
            {/* Main Navigation */}
            <div className="hidden md:flex space-x-10">
              <Link 
                href="/jobs" 
                className="font-medium text-gray-700 hover:text-gray-900"
              >
                Jobs
              </Link>
              <Link 
                href="/companies" 
                className="font-medium text-gray-700 hover:text-gray-900"
              >
                Companies
              </Link>
              <Link 
                href="/services" 
                className="font-medium text-gray-700 hover:text-gray-900"
              >
                Services
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Not Logged In State */}
            {!user && (
              <div className="hidden md:flex md:items-center space-x-4">
                <Link href="/auth" className="border border-blue-600 text-blue-600 font-medium px-5 py-2 rounded-full">
                  Login
                </Link>
                <Link href="/auth" className="bg-red-500 text-white font-medium px-5 py-2 rounded-full">
                  Register
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="font-medium text-gray-700">
                      For employers
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/auth?role=employer" className="cursor-pointer">
                        <Building className="mr-2 h-4 w-4" /> Post a Job
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/employer/plans" className="cursor-pointer">
                        <Layers className="mr-2 h-4 w-4" /> Hiring Solutions
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            {/* Logged In State */}
            {user && (
              <div className="hidden md:flex md:items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative p-1 rounded-full text-gray-400 hover:text-gray-500">
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="ml-3 flex items-center text-sm focus:outline-none">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="ml-2 text-gray-700 font-medium hidden md:block">{user.name}</span>
                      <ChevronDown className="ml-1 text-gray-400 hidden md:block h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href={user.role === 'employer' ? '/employer/dashboard' : 
                              user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} 
                        className="cursor-pointer"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {user.role === 'employer' && (
                  <Link 
                    href="/post-job" 
                    className="bg-red-500 text-white font-medium px-5 py-2 rounded-full"
                  >
                    Post a Job
                  </Link>
                )}
                
                {user.role === 'admin' && (
                  <Link 
                    href="/admin/dashboard" 
                    className="bg-amber-500 text-white font-medium px-5 py-2 rounded-full"
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1 border-b border-gray-200">
          <Link 
            href="/jobs" 
            className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setMobileMenuOpen(false)}
          >
            Jobs
          </Link>
          <Link 
            href="/companies" 
            className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setMobileMenuOpen(false)}
          >
            Companies
          </Link>
          <Link 
            href="/services" 
            className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => setMobileMenuOpen(false)}
          >
            Services
          </Link>
        </div>
        
        {user ? (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user.name}</div>
                <div className="text-sm font-medium text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link 
                href="/profile" 
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Your Profile
              </Link>
              <Link 
                href={user.role === 'employer' ? '/employer/dashboard' : 
                      user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} 
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              {user.role === 'employer' && (
                <Link 
                  href="/post-job" 
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Post a Job
                </Link>
              )}
              {user.role === 'admin' && (
                <Link 
                  href="/admin/dashboard" 
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <button 
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }} 
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex flex-col space-y-3 px-4">
              <Link 
                href="/auth" 
                className="block text-center text-blue-600 border border-blue-600 px-4 py-2 rounded-full font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                href="/auth" 
                className="block text-center text-white bg-red-500 px-4 py-2 rounded-full font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
              <Link 
                href="/auth?role=employer" 
                className="block text-center text-gray-700 border border-gray-300 px-4 py-2 rounded-full font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                For Employers
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
