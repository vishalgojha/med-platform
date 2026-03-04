import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, User } from 'lucide-react';

export default function AddressForm({ formData, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patient_name" className="flex items-center gap-2">
            <User className="w-4 h-4" /> Patient Name *
          </Label>
          <Input
            id="patient_name"
            value={formData.patient_name || ''}
            onChange={(e) => handleChange('patient_name', e.target.value)}
            placeholder="Enter patient name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" /> Phone Number *
          </Label>
          <Input
            id="phone"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="10-digit mobile number"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Full Address *
        </Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="House/Flat No., Building, Street, Area"
          className="mt-1"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="landmark">Landmark</Label>
          <Input
            id="landmark"
            value={formData.landmark || ''}
            onChange={(e) => handleChange('landmark', e.target.value)}
            placeholder="Near temple, school, etc."
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode *</Label>
          <Input
            id="pincode"
            value={formData.pincode || ''}
            onChange={(e) => handleChange('pincode', e.target.value)}
            placeholder="6-digit pincode"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="special_instructions">Special Instructions</Label>
        <Textarea
          id="special_instructions"
          value={formData.special_instructions || ''}
          onChange={(e) => handleChange('special_instructions', e.target.value)}
          placeholder="Any specific instructions for the phlebotomist..."
          className="mt-1"
          rows={2}
        />
      </div>
    </div>
  );
}