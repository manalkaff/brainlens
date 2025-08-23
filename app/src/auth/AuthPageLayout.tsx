import { ReactNode } from 'react';
import { Card, CardContent } from '../components/ui/card';

export function AuthPageLayout({children} : {children: ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background font-platform'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
