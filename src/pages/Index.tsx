
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { VMCard } from '@/components/vm/VMCard';
import { mockVMData } from '@/services/mockData';

const Index = () => {
  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome to VM Captain</h2>
          <p className="text-muted-foreground">
            Manage and monitor your virtual machines from a central dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockVMData.map(vm => (
            <VMCard key={vm.id} vm={vm} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
