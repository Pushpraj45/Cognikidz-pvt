import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CogIcon,
  UserPlusIcon,
  CurrencyDollarIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import TranslatedText from '../ui/TranslatedText';
import PricingService from '../../services/PricingService';
import { toast } from 'react-hot-toast';

const PricingManagement = () => {
  const { user } = useAuth();
  const [pricingConfig, setPricingConfig] = useState(null);
  const [userPurchases, setUserPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grantAccessForm, setGrantAccessForm] = useState({
    userEmail: '',
    assessmentType: '',
    packageId: '',
    expiresAt: '',
  });
  const [showGrantForm, setShowGrantForm] = useState(false);

  useEffect(() => {
    if (user?.isAdmin) {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [configResponse, purchasesResponse] = await Promise.all([
        PricingService.getPricingConfig(),
        PricingService.getUserPurchases(),
      ]);

      setPricingConfig(configResponse.data);
      setUserPurchases(purchasesResponse.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async e => {
    e.preventDefault();

    if (
      !grantAccessForm.userEmail ||
      (!grantAccessForm.assessmentType && !grantAccessForm.packageId)
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const accessData = {
        userEmail: grantAccessForm.userEmail,
        expiresAt: grantAccessForm.expiresAt || null,
      };

      if (grantAccessForm.assessmentType) {
        accessData.assessmentType = grantAccessForm.assessmentType;
      } else if (grantAccessForm.packageId) {
        accessData.packageId = grantAccessForm.packageId;
      }

      await PricingService.grantFreeAccess(accessData);
      toast.success('Free access granted successfully!');

      // Reset form
      setGrantAccessForm({
        userEmail: '',
        assessmentType: '',
        packageId: '',
        expiresAt: '',
      });
      setShowGrantForm(false);

      // Reload data
      loadAdminData();
    } catch (error) {
      console.error('Error granting access:', error);
      toast.error('Failed to grant access');
    }
  };

  const handleUpdateConfig = async updates => {
    try {
      await PricingService.updatePricingConfig(updates);
      toast.success('Pricing configuration updated successfully!');
      loadAdminData();
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update configuration');
    }
  };

  const togglePricing = () => {
    handleUpdateConfig({
      isPricingEnabled: !pricingConfig.isPricingEnabled,
    });
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <XMarkIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            <TranslatedText>Access Denied</TranslatedText>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            <TranslatedText>You need admin privileges to access this page.</TranslatedText>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            <TranslatedText>Pricing Management</TranslatedText>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            <TranslatedText>Manage pricing settings and grant free access to users</TranslatedText>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pricing Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <CogIcon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                <TranslatedText>Pricing Configuration</TranslatedText>
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    <TranslatedText>Pricing Enabled</TranslatedText>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <TranslatedText>Enable or disable pricing for all users</TranslatedText>
                  </p>
                </div>
                <button
                  onClick={togglePricing}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pricingConfig?.isPricingEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pricingConfig?.isPricingEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  <TranslatedText>Admin Emails</TranslatedText>
                </h3>
                <div className="space-y-2">
                  {pricingConfig?.adminEmails?.map((email, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{email}</span>
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  <TranslatedText>Default Currency</TranslatedText>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pricingConfig?.currency?.default || 'INR'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Grant Free Access */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <UserPlusIcon className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                <TranslatedText>Grant Free Access</TranslatedText>
              </h2>
            </div>

            {!showGrantForm ? (
              <button
                onClick={() => setShowGrantForm(true)}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 px-6 rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                <TranslatedText>Grant Access</TranslatedText>
              </button>
            ) : (
              <form onSubmit={handleGrantAccess} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <TranslatedText>User Email</TranslatedText>
                  </label>
                  <input
                    type="email"
                    value={grantAccessForm.userEmail}
                    onChange={e =>
                      setGrantAccessForm({ ...grantAccessForm, userEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <TranslatedText>Assessment Type (Optional)</TranslatedText>
                  </label>
                  <select
                    value={grantAccessForm.assessmentType}
                    onChange={e =>
                      setGrantAccessForm({
                        ...grantAccessForm,
                        assessmentType: e.target.value,
                        packageId: '',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Assessment Type</option>
                    <option value="adhd-form">ADHD Form-based</option>
                    <option value="autism-form">Autism Form-based</option>
                    <option value="dyslexia-form">Dyslexia Form-based</option>
                    <option value="general-form">General Form-based</option>
                    <option value="autism-image">Autism Image-based</option>
                    <option value="adhd-game">ADHD Game-based</option>
                    <option value="dyslexia-game">Dyslexia Game-based</option>
                    <option value="autism-game">Autism Game-based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <TranslatedText>Package ID (Optional)</TranslatedText>
                  </label>
                  <select
                    value={grantAccessForm.packageId}
                    onChange={e =>
                      setGrantAccessForm({
                        ...grantAccessForm,
                        packageId: e.target.value,
                        assessmentType: '',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Package</option>
                    <option value="autism-essential">Autism Essential</option>
                    <option value="autism-advanced">Autism Advanced</option>
                    <option value="adhd-core">ADHD Core</option>
                    <option value="dyslexia-core">Dyslexia Core</option>
                    <option value="general-neuro-check">General Neuro Check</option>
                    <option value="dual-insight-pack">Dual Insight Pack</option>
                    <option value="all-inclusive-pack">All-Inclusive Pack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <TranslatedText>Expires At (Optional)</TranslatedText>
                  </label>
                  <input
                    type="datetime-local"
                    value={grantAccessForm.expiresAt}
                    onChange={e =>
                      setGrantAccessForm({ ...grantAccessForm, expiresAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGrantForm(false)}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <TranslatedText>Cancel</TranslatedText>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 px-6 rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
                  >
                    <TranslatedText>Grant Access</TranslatedText>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>

        {/* User Purchases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <CurrencyDollarIcon className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              <TranslatedText>Recent User Purchases</TranslatedText>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">
                    <TranslatedText>User</TranslatedText>
                  </th>
                  <th className="px-6 py-3">
                    <TranslatedText>Type</TranslatedText>
                  </th>
                  <th className="px-6 py-3">
                    <TranslatedText>Amount</TranslatedText>
                  </th>
                  <th className="px-6 py-3">
                    <TranslatedText>Status</TranslatedText>
                  </th>
                  <th className="px-6 py-3">
                    <TranslatedText>Date</TranslatedText>
                  </th>
                </tr>
              </thead>
              <tbody>
                {userPurchases.slice(0, 10).map(purchase => (
                  <tr
                    key={purchase._id}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {purchase.userId?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      {purchase.purchaseType === 'individual'
                        ? purchase.assessmentType
                        : purchase.packageId}
                    </td>
                    <td className="px-6 py-4">
                      {purchase.currency} {purchase.amount}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          purchase.paymentStatus === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : purchase.paymentStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {purchase.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingManagement;
