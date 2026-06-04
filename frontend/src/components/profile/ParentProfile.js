import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ParentProfile = () => {
  const [formData, setFormData] = useState({
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '(555) 123-4567',
    notifications: true,
    darkMode: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg font-sans">
      <div className="border-b border-gray-200">
        <div className="px-6 py-5 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-text">Parent Profile</h2>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 py-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="name"
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />

            <Input
              id="phone"
              name="phone"
              type="tel"
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
            />

            <div className="space-y-2 flex items-center md:col-span-2">
              <label htmlFor="darkMode" className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="darkMode"
                    name="darkMode"
                    className="sr-only"
                    checked={formData.darkMode}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  <div
                    className={`block ${formData.darkMode ? 'bg-primary' : 'bg-gray-400'} w-14 h-8 rounded-full transition-colors`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${formData.darkMode ? 'transform translate-x-6' : ''}`}
                  ></div>
                </div>
                <div className="ml-3 text-gray-700 font-normal">Dark Mode</div>
              </label>
            </div>

            <div className="space-y-2 flex items-center md:col-span-2">
              <label htmlFor="notifications" className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="notifications"
                    name="notifications"
                    className="sr-only"
                    checked={formData.notifications}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  <div
                    className={`block ${formData.notifications ? 'bg-primary' : 'bg-gray-400'} w-14 h-8 rounded-full transition-colors`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${formData.notifications ? 'transform translate-x-6' : ''}`}
                  ></div>
                </div>
                <div className="ml-3 text-gray-700 font-normal">Email Notifications</div>
              </label>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-4 mt-8">
              <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>

      <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <h3 className="text-lg font-semibold text-text mb-4">Security Settings</h3>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-700 font-semibold">Change Password</p>
            <p className="text-sm text-gray-500">Update your password to ensure account security</p>
          </div>
          <Button variant="ghost">Change Password</Button>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-700 font-semibold">Two-Factor Authentication</p>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
          <Button variant="ghost">Set Up</Button>
        </div>
      </div>
    </div>
  );
};

export default ParentProfile;
