'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { clientsService } from '@/services/clients.service';
import { servicesService } from '@/services/services.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { Client } from '@/types/client.types';

const ROLE_GREET: Record<string, string> = {
  NOTARY: 'Нотаріусе',
  ASSISTANT: 'Асистенте',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  isLoading: boolean;
}

function StatCard({ title, value, icon, color, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { formatDate } = useSettings();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const allClients = await clientsService.getAll();
        setClients(allClients.slice(0, 5));
        setStats((s) => ({ ...s, total: allClients.length }));

        // Load all services for accurate stats
        const allServices = await servicesService.getAll();

        let pending = 0;
        let completed = 0;
        for (const svc of allServices) {
          if (svc.status === 'PENDING' || svc.status === 'IN_PROGRESS') pending++;
          if (svc.status === 'COMPLETED') completed++;
        }
        setStats({ total: allClients.length, pending, completed });
      } catch {
        // Stats are non-critical; fail silently
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const greeting = user ? ROLE_GREET[user.role] ?? '' : '';

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Доброго дня, ${greeting} ${user?.name ?? ''}!`}
        description="Огляд поточного стану системи"
      />

      {/* Stat cards */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <StatCard
          title="Всього клієнтів"
          value={stats.total}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50"
          isLoading={isLoading}
        />
        <StatCard
          title="Очікують послуги"
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          value={stats.pending}
          color="bg-amber-50"
          isLoading={isLoading}
        />
        <StatCard
          title="Завершені послуги"
          value={stats.completed}
          icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
          color="bg-emerald-50"
          isLoading={isLoading}
        />
      </motion.div>

      {/* Recent clients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Нещодавні клієнти</CardTitle>
          <Link href="/clients" className="text-sm text-blue-600 hover:underline">
            Всі клієнти →
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Клієнти відсутні</p>
              <Link
                href="/clients/new"
                className="text-sm text-blue-600 hover:underline"
              >
                Додати першого клієнта
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {clients.map((client) => (
                <Link
                  key={client._id}
                  href={`/clients/${client._id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/40 px-1 rounded transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {client.lastName} {client.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">{client.nationalId}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(client.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
