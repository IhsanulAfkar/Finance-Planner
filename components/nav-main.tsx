'use client';

import { IconCirclePlusFilled, IconMail, type Icon } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useRouter } from '@bprogress/next/app';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: any;
  }[];
}) {
  const pathName = usePathname();
  const router = useRouter();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className="hover:cursor-pointer h-12 transition-colors data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 text-gray-700 hover:bg-gray-100"
                tooltip={item.title}
                isActive={pathName === item.url}
                onClick={() => router.push(item.url)}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
