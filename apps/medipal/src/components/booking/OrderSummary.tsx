import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FlaskConical, Calendar, Clock, MapPin, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function OrderSummary({ cartItems, formData, collectionFee = 99 }) {
  const testsTotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const grandTotal = testsTotal + collectionFee;

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-indigo-600" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tests */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">Tests Booked</p>
          <div className="space-y-2">
            {cartItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-slate-700">{item.test_name}</span>
                <span className="text-sm font-medium">₹{item.price}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Collection Details */}
        {formData.collection_date && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>{format(new Date(formData.collection_date), 'EEEE, MMM d, yyyy')}</span>
            </div>
            {formData.collection_slot && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>{formData.collection_slot}</span>
              </div>
            )}
            {formData.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-indigo-500 mt-0.5" />
                <span className="text-slate-600">{formData.address}</span>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tests Subtotal</span>
            <span>₹{testsTotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Home Collection Fee</span>
            <span>₹{collectionFee}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-indigo-600">₹{grandTotal}</span>
          </div>
        </div>

        {/* Payment Badge */}
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
          <CreditCard className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-sm font-medium">Pay after sample collection</p>
            <p className="text-xs text-slate-500">Cash / UPI / Card accepted</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}