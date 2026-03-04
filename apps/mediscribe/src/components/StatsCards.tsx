import React from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function StatsCards({ title, value, icon: Icon, bgColor, trend }) {
  return (
    <Card className="relative overflow-hidden bg-white border-slate-200 shadow-sm">
      <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-6 -translate-y-6 ${bgColor} rounded-full opacity-10`} />
      <CardHeader className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <CardTitle className="text-2xl font-bold mt-2 text-slate-800">
              {value}
            </CardTitle>
          </div>
          <div className={`p-2.5 rounded-lg ${bgColor} bg-opacity-10`}>
            <Icon className={`w-5 h-5 ${bgColor.replace('bg-', 'text-')}`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-3 text-xs font-medium">
            <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
            <span className="text-green-500">{trend}</span>
            <span className="text-slate-400 ml-1">vs last month</span>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}