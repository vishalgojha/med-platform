import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Loader2, Trash2, ShoppingBag, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CartPage() {
  const queryClient = useQueryClient();
  
  const { data: cartItems, isLoading } = useQuery({
    queryKey: ['cartItems'],
    queryFn: () => appClient.entities.CartItem.list({ limit: 100 }),
  });

  // Filter only "in_cart" items client side for now since simple query
  const activeItems = cartItems?.filter(item => item.status === 'in_cart') || [];
  const total = activeItems.reduce((sum, item) => sum + (item.price || 0), 0);

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.CartItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
      toast.success("Item removed from cart");
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async (items) => {
        // Simulate checkout by updating status
        const promises = items.map(item => 
            appClient.entities.CartItem.update(item.id, { status: 'ordered' })
        );
        await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
      toast.success("Order placed successfully! 🌟 MediPal will contact you shortly.");
    }
  });

  return (
    <div className="py-12 container mx-auto px-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-indigo-600" />
        Your Wellness Cart
      </h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : activeItems.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xl text-slate-500 mb-4">Your cart is empty 🍃</p>
          <Button variant="outline" onClick={() => window.location.href = '/tests'}>
            Browse Tests
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-4">
            {activeItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900">{item.test_name}</h3>
                  <p className="text-indigo-600 font-medium">₹{item.price}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg sticky top-24">
              <h3 className="text-lg font-bold mb-4">Order Summary</h3>
              <div className="flex justify-between mb-2 text-slate-600">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              <div className="flex justify-between mb-2 text-slate-600">
                <span>Home Collection Fee</span>
                <span>₹99</span>
              </div>
              <div className="flex justify-between mb-8 text-xl font-bold text-slate-900 pt-4 border-t">
                <span>Total</span>
                <span>₹{total + 99}</span>
              </div>
              <Link to={createPageUrl('BookCollection')}>
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Book Home Collection
                </Button>
              </Link>
              <p className="text-xs text-center text-slate-400 mt-4">
                🔒 Secure checkout powered by MediPal
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}