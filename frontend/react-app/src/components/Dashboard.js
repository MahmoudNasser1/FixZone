import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Wrench, CheckCircle, Clock, PlusCircle, UserPlus } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Repairs',
      value: '1,254',
      icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Pending',
      value: '82',
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Completed',
      value: '1,100',
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'New Customers',
      value: '73',
      icon: <UserPlus className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  const recentActivities = [
    {
      icon: <PlusCircle className="h-5 w-5 text-green-500" />,
      description: 'New repair request #1256 for iPhone 13.',
      time: '5m ago',
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
      description: 'Repair #1250 marked as completed.',
      time: '1h ago',
    },
    {
      icon: <UserPlus className="h-5 w-5 text-purple-500" />,
      description: 'New customer "Ali Hassan" was registered.',
      time: '3h ago',
    },
     {
      icon: <PlusCircle className="h-5 w-5 text-green-500" />,
      description: 'New repair request #1255 for Samsung S22.',
      time: '6h ago',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center">
                  {activity.icon}
                  <div className="ml-4 flex-1">
                    <p className="text-sm">{activity.description}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Placeholder for another card, e.g., Overdue Tasks */}
        <Card>
            <CardHeader>
                <CardTitle>Overdue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">No overdue tasks.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
