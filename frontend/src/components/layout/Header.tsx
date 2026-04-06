'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_LABELS: Record<string, string> = {
  NOTARY: 'Нотаріус',
  ASSISTANT: 'Асистент',
};

const ROLE_COLORS: Record<string, string> = {
  NOTARY: 'bg-blue-100 text-blue-700',
  ASSISTANT: 'bg-emerald-100 text-emerald-700',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
        aria-label="Відкрити меню"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Role badge */}
      <span
        className={cn(
          'hidden rounded-full px-3 py-1 text-xs font-medium sm:inline-block',
          ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600',
        )}
      >
        {ROLE_LABELS[user.role] ?? user.role}
      </span>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 transition-colors outline-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {getInitials(user.name)}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-gray-500 font-normal mt-0.5">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Вийти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
