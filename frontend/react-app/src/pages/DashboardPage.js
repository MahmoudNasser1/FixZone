import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const DashboardPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Repairs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">152</p>
            <p className="text-xs text-muted-foreground">+12 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">34</p>
            <p className="text-xs text-muted-foreground">+5 new today</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
