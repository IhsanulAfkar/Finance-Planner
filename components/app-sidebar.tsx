'use client';

import * as React from 'react';
import {
  IconDashboard,
  IconLogout,
} from '@tabler/icons-react';

import { NavMasterData } from '@/components/nav-masterdata';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { APP_NAME } from '@/lib/clientConst';
import { signOut } from '@/lib/action/clientAction';
import { ArrowRightLeft, ChartLine, CircleDollarSignIcon, HandCoins, Settings, TrendingUp } from 'lucide-react';
import ThemeSwitcher from './ui/custom/theme-switcher';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: 'Expenses',
      url: '/dashboard/expenses',
      icon: CircleDollarSignIcon,
    },
    {
      title: 'Incomes',
      url: '/dashboard/income',
      icon: TrendingUp,
    },
    {
      title: 'Reports',
      url: '/dashboard/reports',
      icon: ChartLine,
    },
    {
      title: 'Savings Planner',
      url: '/dashboard/savings-planner',
      icon: HandCoins,
    },
    {
      title: 'Settings',
      url: '/dashboard/setting',
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <div className='flex-col px-4 pt-2 mb-4'>

        <p className="text-xl font-bold">{APP_NAME}</p>
        <p className='text-gray-500 text-xs'>Manage your finances</p>
      </div>

      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavMasterData items={data.masterdata} /> */}
        <NavSecondary items={[]} className="mt-auto" />
        <ThemeSwitcher />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log out"
              className="hover:cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive data-[state=open]:bg-destructive/10"
              onClick={() => signOut()}
            >
              <IconLogout />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
