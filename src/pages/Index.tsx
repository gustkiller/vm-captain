
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { VMCard } from '@/components/vm/VMCard';
import { mockVMs } from '@/services/mockData';

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
          {mockVMs.map(vm => (
            <VMCard 
              key={vm.id} 
              id={vm.id}
              name={vm.name}
              description={vm.description}
              status={vm.status}
              os={vm.os}
              cpu={vm.cpu}
              memory={vm.memory}
              cpuUsage={vm.cpuUsage}
              memoryUsage={vm.memoryUsage}
              diskUsage={vm.diskUsage}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
