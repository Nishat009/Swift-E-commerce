'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would save to backend
    console.log('Profile updated:', formData);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{formData.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{formData.email}</p>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing}
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              disabled={!isEditing}
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              disabled={!isEditing}
            />
            <Input
              label="Zip Code"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <div className="flex gap-4 pt-4">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

