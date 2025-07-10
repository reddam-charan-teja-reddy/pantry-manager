'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User as UserType } from '@/lib/types';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  ShoppingCart,
  User,
  Bell,
  LogOut,
  ChevronDown,
  List,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
} from '@/components/ui/toast';
import { ToastProps } from '@/hooks/use-toast';
import { Logo } from '../Logo';
import { LogoIcon } from '../LogoIcon';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/userInfoSlice';
import { resetProfile } from '@/store/profileSlice';
import { persistor, resetStore } from '@/store/store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pantry', label: 'Pantry', icon: List },
  { href: '/add-items', label: 'Add Items', icon: PlusCircle },
  { href: '/recipes', label: 'Recipes', icon: BookOpen },
  { href: '/shopping-list', label: 'Shopping List', icon: ShoppingCart },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
];

const AppLayout = ({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle: string;
}) => {
  const isMobile = useIsMobile();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { authState, authLoading, userDetails } = useAppSelector(
    (state) => state.user
  );

  // Create a user object that matches the UserType interface
  const user: UserType | null = authState
    ? {
        uid: userDetails.uid,
        email: userDetails.email,
        displayName: userDetails.name,
        photoURL: userDetails.photoURL,
      }
    : null;

  const handleLogout = () => {
    // Clear session storage data
    sessionStorage.removeItem('pantryRecipes');

    // Clear all session storage related to profile
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('profileLoaded');
      // Clear any other session storage items if needed
    }

    // First dispatch logout to clear auth state
    dispatch(logout());

    // Then dispatch resetStore to reset all slices to their initial state
    dispatch(resetStore());

    // Also clear persisted state to be safe
    persistor.purge().then(() => {
      // Navigate to homepage after state is cleared
      router.push('/');
    });
  };

  React.useEffect(() => {
    if (!authLoading && !authState) {
      router.push('/');
    }
  }, [authLoading, authState, router]);

  if (authLoading || !authState) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <LogoIcon className='h-12 w-12 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip='Logout'>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className='sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='md:hidden' />
            <h1 className='text-xl font-semibold'>{pageTitle}</h1>
          </div>
          <UserMenu user={user} onLogout={handleLogout} />
        </header>
        <main className='flex-1 p-4 pb-20 sm:p-6 sm:pb-6'>{children}</main>
        {/* Toast Integration */}
        <ToastProvider>
          <ToastContainer />
          <ToastViewport />
        </ToastProvider>
        {isMobile && <BottomNav />}
      </SidebarInset>
    </SidebarProvider>
  );
};

const NavItem = ({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link href={href}>
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const UserMenu = ({
  user,
  onLogout,
}: {
  user: UserType | null;
  onLogout: () => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='relative h-10 w-auto justify-start gap-2 px-2'>
          <Avatar className='h-8 w-8'>
            {user?.photoURL ? (
              <AvatarImage
                src={user.photoURL}
                alt={user?.displayName || 'User'}
              />
            ) : null}
            <AvatarFallback>
              {user?.displayName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className='hidden flex-col items-start sm:flex'>
            <span className='text-sm font-medium'>{user?.displayName}</span>
            <span className='text-xs text-muted-foreground'>{user?.email}</span>
          </div>
          <ChevronDown className='ml-2 hidden h-4 w-4 text-muted-foreground sm:block' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/profile'>
            <User className='mr-2 h-4 w-4' />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className='mr-2 h-4 w-4' />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const BottomNav = () => {
  const pathname = usePathname();
  const mainNavItems = navItems.slice(0, 4);

  return (
    <div className='fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur-sm md:hidden'>
      <div className='grid h-16 grid-cols-4'>
        {mainNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className='flex flex-col items-center justify-center gap-1 text-xs font-medium'>
              <Icon
                className={`h-6 w-6 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={isActive ? 'text-primary' : 'text-muted-foreground'}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Component to render toasts when dispatched via CustomEvent
function ToastContainer() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);
  React.useEffect(() => {
    const handler = (e: CustomEvent<ToastProps>) => {
      setToasts((prev) => [...prev, e.detail]);
    };
    window.addEventListener('radix-toast', handler as EventListener);
    return () =>
      window.removeEventListener('radix-toast', handler as EventListener);
  }, []);
  return (
    <>
      {toasts.map((t, i) => (
        <Toast
          key={i}
          open
          onOpenChange={() =>
            setToasts((prev) => prev.filter((_, idx) => idx !== i))
          }
          variant={t.variant || 'default'}>
          <ToastTitle>{t.title}</ToastTitle>
          {t.description && (
            <ToastDescription>{t.description}</ToastDescription>
          )}
        </Toast>
      ))}
    </>
  );
}

export default AppLayout;
