import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { LoginForm } from 'wasp/client/auth';
import { AuthPageLayout } from './AuthPageLayout';
import { Separator } from '../components/ui/separator';

export default function Login() {
  return (
    <AuthPageLayout>
      <LoginForm />
      
      <div className="space-y-4 mt-6">
        <Separator />
        <div className="text-center space-y-2">
          <p className='text-sm font-medium text-muted-foreground font-platform'>
            Don't have an account yet?{' '}
            <WaspRouterLink to={routes.SignupRoute.to} className='text-primary hover:underline'>
              Sign up
            </WaspRouterLink>
          </p>
          <p className='text-sm font-medium text-muted-foreground font-platform'>
            Forgot your password?{' '}
            <WaspRouterLink to={routes.RequestPasswordResetRoute.to} className='text-primary hover:underline'>
              Reset it
            </WaspRouterLink>
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );
}
