'use client';

import Link from 'next/link';
import { LayoutDashboard, DollarSign, FileText, TrendingUp, ClipboardList, Receipt } from 'lucide-react';

export default function Home() {
  const menuItems = [
    {
      title: 'Movimentações',
      description: 'Lançar entradas e saídas',
      href: '/movimentacoes',
      icon: DollarSign,
      color: 'bg-blue-500',
    },
    {
      title: 'Contas a Pagar',
      description: 'Gerenciar contas a pagar',
      href: '/contas-pagar',
      icon: FileText,
      color: 'bg-red-500',
    },
    {
      title: 'Contas a Receber',
      description: 'Gerenciar contas a receber',
      href: '/contas-receber',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Projetos',
      description: 'Gerenciar projetos/obras',
      href: '/projetos',
      icon: ClipboardList,
      color: 'bg-purple-500',
    },
    {
      title: 'Notas Fiscais',
      description: 'Emitir e gerenciar notas fiscais',
      href: '/notas-fiscais',
      icon: Receipt,
      color: 'bg-orange-500',
    },
    {
      title: 'Relatórios',
      description: 'Visualizar relatórios financeiros',
      href: '/relatorios',
      icon: LayoutDashboard,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Marcenaria</h1>
          <p className="mt-2 text-gray-600">Sistema de gestão financeira completo</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${item.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">{item.title}</h2>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

