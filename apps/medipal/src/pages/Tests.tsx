import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Loader2 } from 'lucide-react';
import TestCard from '../components/TestCard';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function TestsPage() {
  const [search, setSearch] = React.useState('');
  
  const { data: tests, isLoading } = useQuery({
    queryKey: ['tests'],
    queryFn: () => appClient.entities.Test.list({ limit: 50 }),
  });

  const handleAddToCart = async (test) => {
    try {
      await appClient.entities.CartItem.create({
        test_name: test.name,
        price: test.price,
        status: 'in_cart'
      });
      toast.success(`Added ${test.name} to your cart! 🎉`);
    } catch (error) {
        console.error(error);
      toast.error("Could not add to cart.");
    }
  };

  const filteredTests = tests?.filter(test => 
    test.name.toLowerCase().includes(search.toLowerCase()) || 
    test.simple_explanation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-12 container mx-auto px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">All Tests</h1>
        <p className="text-slate-600 mb-8">Browse our catalog of simple, explained health checks.</p>
        
        <div className="max-w-md mx-auto">
          <Input 
            placeholder="Search for 'tired', 'vitamin', or 'blood'..." 
            className="h-12 text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTests?.map((test) => (
            <TestCard 
              key={test.id} 
              test={test} 
              onAddToCart={handleAddToCart} 
            />
          ))}
          {filteredTests?.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No tests found matching "{search}". Try searching for "blood" or "checkup".
            </div>
          )}
        </div>
      )}
    </div>
  );
}