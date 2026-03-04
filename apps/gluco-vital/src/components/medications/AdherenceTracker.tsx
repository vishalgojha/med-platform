import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay, isToday, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Pill
} from "lucide-react";

const STATUS_CONFIG = {
  taken: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", label: "Taken" },
  missed: { icon: XCircle, color: "text-red-600", bg: "bg-red-100", label: "Missed" },
  late: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100", label: "Late" },
  skipped: { icon: AlertTriangle, color: "text-slate-500", bg: "bg-slate-100", label: "Skipped" },
  pending: { icon: Clock, color: "text-blue-600", bg: "bg-blue-100", label: "Pending" }
};

export default function AdherenceTracker({ userEmail, reminders = [] }) {
  const [selectedDays, setSelectedDays] = useState(7);

  const { data: adherenceRecords = [], isLoading } = useQuery({
    queryKey: ['medication-adherence', userEmail, selectedDays],
    queryFn: async () => {
      const startDate = subDays(new Date(), selectedDays);
      const records = await appClient.entities.MedicationAdherence.filter({
        user_email: userEmail
      }, '-scheduled_time', 500);
      return records.filter(r => new Date(r.scheduled_time) >= startDate);
    },
    enabled: !!userEmail
  });

  // Calculate adherence stats
  const stats = React.useMemo(() => {
    if (adherenceRecords.length === 0) return { rate: 0, taken: 0, missed: 0, total: 0 };
    
    const completed = adherenceRecords.filter(r => r.status === 'taken' || r.status === 'late');
    const missed = adherenceRecords.filter(r => r.status === 'missed');
    const total = adherenceRecords.filter(r => r.status !== 'pending').length;
    
    return {
      rate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
      taken: completed.length,
      missed: missed.length,
      total
    };
  }, [adherenceRecords]);

  // Group by medication
  const byMedication = React.useMemo(() => {
    const grouped = {};
    adherenceRecords.forEach(record => {
      if (!grouped[record.medication_name]) {
        grouped[record.medication_name] = { taken: 0, missed: 0, late: 0, total: 0 };
      }
      if (record.status !== 'pending') {
        grouped[record.medication_name].total++;
        if (record.status === 'taken') grouped[record.medication_name].taken++;
        if (record.status === 'missed') grouped[record.medication_name].missed++;
        if (record.status === 'late') grouped[record.medication_name].late++;
      }
    });
    return grouped;
  }, [adherenceRecords]);

  // Today's pending doses
  const todayPending = adherenceRecords.filter(r => 
    r.status === 'pending' && isToday(parseISO(r.scheduled_time))
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Adherence Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#5b9a8b]" />
              Medication Adherence
            </CardTitle>
            <div className="flex gap-1">
              {[7, 14, 30].map(days => (
                <Button
                  key={days}
                  size="sm"
                  variant={selectedDays === days ? "default" : "outline"}
                  onClick={() => setSelectedDays(days)}
                  className="h-7 px-2 text-xs"
                >
                  {days}d
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-slate-800">{stats.rate}%</span>
                <span className="text-sm text-slate-500">adherence rate</span>
              </div>
              <Progress 
                value={stats.rate} 
                className="h-2"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <p className="text-lg font-semibold text-green-700">{stats.taken}</p>
              <p className="text-xs text-green-600">Taken</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <p className="text-lg font-semibold text-red-700">{stats.missed}</p>
              <p className="text-xs text-red-600">Missed</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-lg font-semibold text-slate-700">{stats.total}</p>
              <p className="text-xs text-slate-600">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Pending */}
      {todayPending.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Clock className="w-4 h-4" />
              Pending Today ({todayPending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayPending.map(record => (
                <div key={record.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-sm">{record.medication_name}</span>
                    <span className="text-xs text-slate-500">
                      {format(parseISO(record.scheduled_time), "h:mm a")}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-amber-700 border-amber-300">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per Medication Breakdown */}
      {Object.keys(byMedication).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="w-4 h-4 text-violet-500" />
              By Medication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(byMedication).map(([name, data]) => {
                const rate = data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <span className={rate >= 80 ? "text-green-600" : rate >= 50 ? "text-amber-600" : "text-red-600"}>
                        {rate}%
                      </span>
                    </div>
                    <Progress value={rate} className="h-1.5" />
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span>✓ {data.taken}</span>
                      <span>✗ {data.missed}</span>
                      {data.late > 0 && <span>⏱ {data.late} late</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adherenceRecords.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No adherence data yet. Take your medications and confirm!
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {adherenceRecords.slice(0, 15).map(record => {
                const config = STATUS_CONFIG[record.status];
                const Icon = config.icon;
                return (
                  <div key={record.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${config.bg}`}>
                        <Icon className={`w-3 h-3 ${config.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{record.medication_name}</p>
                        <p className="text-xs text-slate-500">
                          {format(parseISO(record.scheduled_time), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${config.color} text-xs`}>
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}