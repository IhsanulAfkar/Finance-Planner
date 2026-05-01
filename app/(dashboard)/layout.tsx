import { AppSidebar } from '@/components/app-sidebar';
import ChatHistory from '@/components/ChatHistory';
import BackgroundProcessBar from '@/components/pages/BackgroundProcessBar';
import { ChatAssistant } from '@/components/pages/ChatAssistant';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getServerSession } from '@/lib/serverSession';
import { SessionProvider } from '@/providers/SessionProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { NextPage } from 'next';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const Layout = async ({ children }: Props) => {
  const session = await getServerSession();
  if (!session) redirect('/auth/login');
  return (
    <SessionProvider session={session}>
      <SocketProvider>
        <SidebarProvider
          style={
            {
              '--sidebar-width': 'calc(var(--spacing) * 72)',
              '--header-height': 'calc(var(--spacing) * 12)',
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" />
          <SidebarInset>
            {/* <SiteHeader /> */}

            <div className="flex flex-1 flex-col">
              <div className="@container/main dark:bg-background light:bg-[#f9fafb] flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 md:px-6">
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
          <BackgroundProcessBar />
          <ChatAssistant />
        </SidebarProvider>
      </SocketProvider>
    </SessionProvider>
  );
};

export default Layout;
