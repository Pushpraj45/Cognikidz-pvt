import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

const FeedbackDashboard = () => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [filters]);

  const fetchFeedback = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/feedback?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        setFeedback(result.data);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/feedback/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateFeedbackStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchFeedback();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteFeedback = async id => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        const response = await fetch(`/api/feedback/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchFeedback();
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting feedback:', error);
      }
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = status => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      reviewed: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = priority => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Dashboard</h1>
        <p className="text-gray-600">Manage and review user feedback submissions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Feedback</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Rating</h3>
            <p className="text-3xl font-bold text-green-600">{stats.averageOverallRating}/5</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendation Score</h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats.averageRecommendationScore}/10
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">New Submissions</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.statusBreakdown?.new || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={e => setFilters({ ...filters, priority: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', priority: '', page: 1, limit: 20 })}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Feedback Submissions</h3>
        </div>

        {feedback.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No feedback submissions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedback.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-gray-500">{item.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={item.status}
                        onChange={e => updateFeedbackStatus(item._id, e.target.value)}
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                      >
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.overallRating ? `${item.overallRating}/5` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedFeedback(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteFeedback(item._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Feedback Details - {selectedFeedback.name || 'Anonymous'}
              </h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Contact Information</h4>
                  <p>
                    <strong>Email:</strong> {selectedFeedback.email}
                  </p>
                  <p>
                    <strong>Name:</strong> {selectedFeedback.name || 'Not provided'}
                  </p>
                  <p>
                    <strong>Testing Duration:</strong>{' '}
                    {selectedFeedback.testingDuration || 'Not specified'}
                  </p>
                </div>

                {selectedFeedback.overallRating && (
                  <div>
                    <h4 className="font-semibold text-gray-900">Overall Experience</h4>
                    <p>
                      <strong>Overall Rating:</strong> {selectedFeedback.overallRating}/5
                    </p>
                    <p>
                      <strong>Recommendation Score:</strong> {selectedFeedback.recommendationScore}
                      /10
                    </p>
                  </div>
                )}

                {selectedFeedback.whatWorkedWell && (
                  <div>
                    <h4 className="font-semibold text-gray-900">What Worked Well</h4>
                    <p className="text-gray-700">{selectedFeedback.whatWorkedWell}</p>
                  </div>
                )}

                {selectedFeedback.needsImprovement && (
                  <div>
                    <h4 className="font-semibold text-gray-900">Needs Improvement</h4>
                    <p className="text-gray-700">{selectedFeedback.needsImprovement}</p>
                  </div>
                )}

                {selectedFeedback.additionalFeedback && (
                  <div>
                    <h4 className="font-semibold text-gray-900">Additional Feedback</h4>
                    <p className="text-gray-700">{selectedFeedback.additionalFeedback}</p>
                  </div>
                )}

                {selectedFeedback.bugReports && selectedFeedback.bugReports.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900">Bug Reports</h4>
                    {selectedFeedback.bugReports.map((bug, index) => (
                      <div key={index} className="border-l-4 border-red-400 pl-4 mb-2">
                        <p>
                          <strong>Location:</strong> {bug.location}
                        </p>
                        <p>
                          <strong>Impact:</strong> {bug.impact}
                        </p>
                        <p>
                          <strong>Description:</strong> {bug.description}
                        </p>
                        {bug.reproductionSteps && (
                          <p>
                            <strong>Steps to Reproduce:</strong> {bug.reproductionSteps}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDashboard;
