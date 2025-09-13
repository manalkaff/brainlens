import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { SignupForm } from 'wasp/client/auth';
import { AuthPageLayout } from './AuthPageLayout';
import { Separator } from '../components/ui/separator';

export function Signup() {
  return (
    <AuthPageLayout>
      <SignupForm />
      
      <div className="space-y-4 mt-6">
        <Separator />
        <div className="text-center">
          <p className='text-sm font-medium text-muted-foreground font-platform'>
            Already have an account?{' '}
            <WaspRouterLink to={routes.LoginRoute.to} className='text-primary hover:underline'>
              Sign in
            </WaspRouterLink>
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );
}
