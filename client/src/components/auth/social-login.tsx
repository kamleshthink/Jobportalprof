import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SocialLoginProps {
  onLoginStart?: () => void;
  className?: string;
}

const SocialLogin = ({ onLoginStart, className = '' }: SocialLoginProps) => {
  const { socialLogin } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    if (onLoginStart) onLoginStart();
    socialLogin('google');
  };

  const handleFacebookLogin = () => {
    setIsFacebookLoading(true);
    if (onLoginStart) onLoginStart();
    socialLogin('facebook');
  };

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <Button
        type="button"
        variant="outline"
        className="flex items-center justify-center w-full"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isFacebookLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
        )}
        Continue with Google
      </Button>
      
      <Button
        type="button"
        variant="outline"
        className="flex items-center justify-center w-full"
        onClick={handleFacebookLogin}
        disabled={isGoogleLoading || isFacebookLoading}
      >
        {isFacebookLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
        )}
        Continue with Facebook
      </Button>
    </div>
  );
};

export default SocialLogin;