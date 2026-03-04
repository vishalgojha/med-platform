import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CheckCircle, Home, Loader2 } from 'lucide-react';

import AddressForm from '../components/booking/AddressForm';
import SlotPicker from '../components/booking/SlotPicker';
import OrderSummary from '../components/booking/OrderSummary';

const COLLECTION_FEE = 99;

export default function BookCollectionPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    patient_name: '',
    phone: '',
    address: '',
    landmark: '',
    pincode: '',
    collection_date: '',
    collection_slot: '',
    special_instructions: ''
  });
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems = [], isLoading: cartLoading } = useQuery({
    queryKey: ['cart-items'],
    queryFn: () => appClient.entities.CartItem.filter({ status: 'in_cart' }),
  });

  // Fetch user data to pre-fill
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await appClient.auth.me();
        if (user) {
          setFormData(prev => ({
            ...prev,
            patient_name: user.full_name || '',
          }));
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  // Create booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (data) => {
      // Generate OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      
      const booking = await appClient.entities.HomeCollection.create({
        ...data,
        tests_booked: cartItems.map(i => i.test_name).join(', '),
        total_amount: cartItems.reduce((sum, i) => sum + (i.price || 0), 0) + COLLECTION_FEE,
        status: 'Booked',
        payment_status: 'Pending',
        collection_otp: otp
      });

      // Update cart items to ordered
      for (const item of cartItems) {
        await appClient.entities.CartItem.update(item.id, { status: 'ordered' });
      }

      return booking;
    },
    onSuccess: (data) => {
      setBookingId(data.id);
      setBookingComplete(true);
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      toast.success('Booking confirmed! 🎉');
    },
    onError: () => {
      toast.error('Booking failed. Please try again.');
    }
  });

  const handleSubmit = () => {
    if (!formData.patient_name || !formData.phone || !formData.address || !formData.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!formData.collection_date || !formData.collection_slot) {
      toast.error('Please select date and time slot');
      return;
    }
    bookingMutation.mutate(formData);
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (cartItems.length === 0 && !bookingComplete) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-lg mx-auto text-center py-20">
          <Home className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No tests in cart</h2>
          <p className="text-slate-500 mb-6">Add tests to your cart first to book home collection</p>
          <Link to={createPageUrl('Tests')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Browse Tests</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Booking Confirmed! 🎉</h1>
          <p className="text-slate-600 mb-6">
            Our phlebotomist will visit you on<br />
            <span className="font-semibold">{formData.collection_date}</span> between <span className="font-semibold">{formData.collection_slot}</span>
          </p>
          
          <Card className="text-left mb-6">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-1">Your Collection OTP</p>
              <p className="text-3xl font-bold text-indigo-600 tracking-widest">{bookingMutation.data?.collection_otp}</p>
              <p className="text-xs text-slate-400 mt-2">Share this with phlebotomist for verification</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Link to={createPageUrl('TrackOrder') + `?id=${bookingId}`} className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Track Your Order</Button>
            </Link>
            <Link to={createPageUrl('Home')} className="block">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl('Cart')} className="inline-flex items-center text-slate-600 hover:text-indigo-600 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Book Home Collection</h1>
          <p className="text-slate-500">Our phlebotomist will come to your doorstep</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {s}
              </div>
              {s < 2 && <div className={`flex-1 h-1 ${step > s ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {step === 1 ? 'Collection Address' : 'Select Date & Time'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {step === 1 ? (
                  <AddressForm formData={formData} onChange={setFormData} />
                ) : (
                  <SlotPicker
                    selectedDate={formData.collection_date}
                    selectedSlot={formData.collection_slot}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, collection_date: date }))}
                    onSlotChange={(slot) => setFormData(prev => ({ ...prev, collection_slot: slot }))}
                  />
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-6 pt-6 border-t">
                  {step > 1 ? (
                    <Button variant="outline" onClick={() => setStep(step - 1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                  ) : <div />}
                  
                  {step < 2 ? (
                    <Button 
                      onClick={() => setStep(2)}
                      disabled={!formData.patient_name || !formData.phone || !formData.address || !formData.pincode}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit}
                      disabled={bookingMutation.isPending || !formData.collection_date || !formData.collection_slot}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {bookingMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Confirm Booking
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <OrderSummary 
              cartItems={cartItems} 
              formData={formData}
              collectionFee={COLLECTION_FEE}
            />
          </div>
        </div>
      </div>
    </div>
  );
}