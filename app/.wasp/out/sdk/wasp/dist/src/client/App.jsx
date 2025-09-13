import { useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { routes } from 'wasp/client/router';
import './Main.css';
import NavBar from './components/NavBar/NavBar';
import { demoNavigationitems, learningNavigationItems, marketingNavigationItems } from './components/NavBar/constants';
import CookieConsentBanner from './components/cookie-consent/Banner';
import { usePendingTopicHandler } from '../landing-page/hooks/usePendingTopicHandler';
/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
    const location = useLocation();
    // Handle pending topic creation after authentication
    usePendingTopicHandler();
    const isMarketingPage = useMemo(() => {
        return location.pathname === '/' || location.pathname.startsWith('/pricing') || location.pathname === '/home';
    }, [location]);
    const isLearningPage = useMemo(() => {
        return location.pathname.startsWith('/learn');
    }, [location]);
    const navigationItems = useMemo(() => {
        if (isMarketingPage)
            return marketingNavigationItems;
        if (isLearningPage)
            return learningNavigationItems;
        return demoNavigationitems;
    }, [isMarketingPage, isLearningPage]);
    const isAdminDashboard = useMemo(() => {
        return location.pathname.startsWith('/admin');
    }, [location]);
    const shouldDisplayAppNavBar = useMemo(() => {
        return (location.pathname !== routes.LoginRoute.build() &&
            location.pathname !== routes.SignupRoute.build() &&
            !isLearningPage &&
            !isAdminDashboard);
    }, [location, isLearningPage, isAdminDashboard]);
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView();
            }
        }
    }, [location]);
    return (<>
      <div className='min-h-screen bg-background text-foreground'>
        {isAdminDashboard || isLearningPage ? (<Outlet />) : isMarketingPage ? (<>
            {shouldDisplayAppNavBar && <NavBar navigationItems={navigationItems}/>}
            <Outlet />
          </>) : (<>
            {shouldDisplayAppNavBar && <NavBar navigationItems={navigationItems}/>}
            <div className='mx-auto max-w-screen-2xl'>
              <Outlet />
            </div>
          </>)}
      </div>
      <CookieConsentBanner />
    </>);
}
//# sourceMappingURL=App.jsx.map