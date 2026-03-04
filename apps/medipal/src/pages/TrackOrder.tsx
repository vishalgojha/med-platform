import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  Clock, 
  FlaskConical, 
  Home, 
  Loader2, 
  MapPin, 
  Phone, 
  Truck, 
  User,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusSteps = [
  { id: 'Booked', label: 'Booked', icon: CheckCircle },
  { id: 'Phlebotomist Assigned', label: 'Phlebotomist Assigned', icon: User },
  { id: 'Sample Collected', label: 'Sample Collected', icon: FlaskConical },
  { id: 'In Transit', label: 'In Transit to Lab', icon: Truck },
  { id: 'Processing', label: 'Processing', icon: Clock },
  { id: 'Report Ready', label: 'Report Ready', icon: FileText },
];

export default function TrackOrderPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => appClient.entities.HomeCollection.filter({ id: orderId }),
    enabled: !!orderId,
    select: (data) => data[0]
  });

  // Fetch all orders if no specific ID
  const { data: allOrders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => appClient.entities.HomeCollection.list('-created_date', 10),
    enabled: !orderId
  });

  if (!orderId && allOrders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-lg mx-auto text-center py-20">
          <Truck className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No Orders Yet</h2>
          <p className="text-slate-500 mb-6">Book your first home collection to track it here</p>
          <Link to={createPageUrl('Tests')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Browse Tests</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show list of orders if no specific ID
  if (!orderId) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">My Orders</h1>
          <div className="space-y-4">
            {allOrders.map((o) => (
              <Link key={o.id} to={createPageUrl('TrackOrder') + `?id=${o.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{o.tests_booked}</p>
                        <p className="text-sm text-slate-500">
                          {o.collection_date && format(new Date(o.collection_date), 'MMM d, yyyy')} • {o.collection_slot}
                        </p>
                      </div>
                      <Badge className={cn(
                        o.status === 'Report Ready' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'Booked' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      )}>
                        {o.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-lg mx-auto text-center py-20">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Order not found</h2>
          <Link to={createPageUrl('Home')}>
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Link to={createPageUrl('TrackOrder')} className="inline-flex items-center text-slate-600 hover:text-indigo-600 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> All Orders
        </Link>
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                Track Order
              </CardTitle>
              <Badge className={cn(
                order.status === 'Report Ready' ? 'bg-emerald-100 text-emerald-700' :
                'bg-blue-100 text-blue-700'
              )}>
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress Tracker */}
            <div className="relative">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step.id} className="flex items-start gap-4 pb-6 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2",
                        isCompleted 
                          ? "bg-indigo-600 border-indigo-600 text-white" 
                          : "bg-white border-slate-200 text-slate-400"
                      )}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-full absolute top-10 left-1/2 -translate-x-1/2",
                          index < currentStepIndex ? "bg-indigo-600" : "bg-slate-200"
                        )} style={{ height: '24px' }} />
                      )}
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={cn(
                        "font-medium",
                        isCompleted ? "text-slate-800" : "text-slate-400"
                      )}>
                        {step.label}
                      </p>
                      {isCurrent && step.id === 'Phlebotomist Assigned' && order.phlebotomist_name && (
                        <div className="mt-2 p-3 bg-indigo-50 rounded-lg">
                          <p className="text-sm font-medium text-indigo-800">{order.phlebotomist_name}</p>
                          <p className="text-sm text-indigo-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {order.phlebotomist_phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Tests</p>
              <p className="font-medium">{order.tests_booked}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Collection Date</p>
                <p className="font-medium">{order.collection_date && format(new Date(order.collection_date), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Time Slot</p>
                <p className="font-medium">{order.collection_slot}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Address
              </p>
              <p className="font-medium">{order.address}</p>
              {order.landmark && <p className="text-sm text-slate-500">Near: {order.landmark}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Total Amount</p>
                <p className="font-bold text-lg text-indigo-600">₹{order.total_amount}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Payment</p>
                <Badge variant="outline">{order.payment_status}</Badge>
              </div>
            </div>

            {order.collection_otp && order.status === 'Booked' && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700 mb-1">Collection OTP</p>
                <p className="text-2xl font-bold text-amber-800 tracking-widest">{order.collection_otp}</p>
                <p className="text-xs text-amber-600 mt-1">Share with phlebotomist for verification</p>
              </div>
            )}

            {order.status === 'Report Ready' && (
              <Link to={createPageUrl('Reports')}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <FileText className="w-4 h-4 mr-2" /> View Report
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}