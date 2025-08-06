import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetResponsesQuery, useDeleteResponseMutation } from '../../store/api/responsesApi';
import {
  Clock,
  User,
  FileText,
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  Eye,
  Trash2
} from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, trend, color = 'tw-text-gray-600' }) => (
  <div className="tw-bg-white tw-rounded-2xl tw-p-6 tw-border tw-border-gray-100 tw-transition-all tw-duration-200 hover:tw-shadow-lg hover:tw-border-gray-200">
    <div className="tw-flex tw-items-start tw-justify-between">
      <div className="tw-flex-1">
        <p className="tw-text-sm tw-font-light tw-text-gray-500 tw-mb-1">{label}</p>
        <p className="tw-text-3xl tw-font-light tw-tracking-tight tw-text-gray-900">{value}</p>
        {trend && (
          <div className="tw-flex tw-items-center tw-mt-2 tw-gap-1">
            <TrendingUp className="tw-w-4 tw-h-4 tw-text-emerald-500" />
            <span className="tw-text-xs tw-text-emerald-600">+{trend}% this week</span>
          </div>
        )}
      </div>
      <div className={`tw-p-3 tw-rounded-xl tw-bg-gray-50 ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
    case 'submitted':
      return <CheckCircle className="tw-w-4 tw-h-4 tw-text-emerald-500" />;
    case 'reviewed':
      return <CheckCircle className="tw-w-4 tw-h-4 tw-text-blue-500" />;
    case 'in_progress':
      return <AlertCircle className="tw-w-4 tw-h-4 tw-text-amber-500" />;
    default:
      return <XCircle className="tw-w-4 tw-h-4 tw-text-gray-400" />;
  }
};

const getStatusBadge = (status: string) => {
  const colors = {
    'completed': 'tw-bg-emerald-100 tw-text-emerald-700',
    'submitted': 'tw-bg-emerald-100 tw-text-emerald-700',
    'reviewed': 'tw-bg-blue-100 tw-text-blue-700',
    'in_progress': 'tw-bg-amber-100 tw-text-amber-700',
    'pending': 'tw-bg-gray-100 tw-text-gray-700'
  };
  
  const statusText = status?.replace('_', ' ') || 'pending';
  const colorClass = colors[status as keyof typeof colors] || colors.pending;
  
  return (
    <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${colorClass}`}>
      {getStatusIcon(status)}
      <span className="tw-capitalize">{statusText}</span>
    </span>
  );
};

export const MinimalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  
  const { data: responsesData, isLoading, error, refetch } = useGetResponsesQuery({ 
    page_size: 50, 
    ordering: '-submitted_at' 
  });
  
  const [deleteResponse, { isLoading: isDeleting }] = useDeleteResponseMutation();
  
  const responses = useMemo(() => responsesData?.results || [], [responsesData?.results]);
  
  const handleDelete = async (responseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ open: true, id: responseId });
  };
  
  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      try {
        console.log('Attempting to delete response ID:', deleteConfirm.id);
        const result = await deleteResponse(deleteConfirm.id).unwrap();
        console.log('Delete successful:', result);
        refetch();
      } catch (error: any) {
        console.error('Failed to delete response:', error);
        console.error('Error details:', {
          status: error?.status,
          data: error?.data,
          originalStatus: error?.originalStatus,
          id: deleteConfirm.id
        });
      }
    }
    setDeleteConfirm({ open: false, id: null });
  };
  
  const metrics = useMemo(() => {
    const total = responses.length;
    const completed = responses.filter(r => r.status === 'completed' || r.status === 'submitted').length;
    const pending = responses.filter(r => r.status === 'in_progress').length;
    const avgTime = responses.reduce((acc, r) => acc + (r.completion_time_seconds || 0), 0) / total || 0;
    
    return {
      total,
      completed,
      pending,
      avgTime: Math.round(avgTime / 60)
    };
  }, [responses]);

  const filteredResponses = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return responses.filter(r => r.status === 'in_progress');
      case 'completed':
        return responses.filter(r => r.status === 'completed' || r.status === 'submitted');
      default:
        return responses;
    }
  }, [responses, activeTab]);

  if (error) {
    return (
      <div className="tw-min-h-screen tw-bg-gray-50 tw-p-6">
        <div className="tw-max-w-7xl tw-mx-auto">
          <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-p-6 tw-text-center">
            <XCircle className="tw-w-12 tw-h-12 tw-text-red-500 tw-mx-auto tw-mb-3" />
            <p className="tw-text-red-800">Failed to load dashboard data</p>
            <button 
              onClick={() => window.location.reload()}
              className="tw-mt-4 tw-px-4 tw-py-2 tw-bg-red-100 tw-text-red-700 tw-rounded-lg hover:tw-bg-red-200 tw-transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-min-h-screen tw-bg-gray-50">
      <div className="tw-max-w-7xl tw-mx-auto tw-p-6 tw-space-y-6">
        {/* Header */}
        <div className="tw-mb-8">
          <h1 className="tw-text-2xl tw-font-light tw-text-gray-900 tw-tracking-tight">
            Healthcare Forms Dashboard
          </h1>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-2">
            Monitor patient form submissions and completion metrics
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-8">
          <MetricCard 
            label="Total Responses"
            value={metrics.total}
            icon={<Activity className="tw-w-5 tw-h-5" />}
            trend={12}
            color="tw-text-blue-600"
          />
          <MetricCard 
            label="Completed"
            value={metrics.completed}
            icon={<CheckCircle className="tw-w-5 tw-h-5" />}
            color="tw-text-emerald-600"
          />
          <MetricCard 
            label="Pending"
            value={metrics.pending}
            icon={<AlertCircle className="tw-w-5 tw-h-5" />}
            color="tw-text-amber-600"
          />
          <MetricCard 
            label="Avg. Time"
            value={`${metrics.avgTime}m`}
            icon={<Clock className="tw-w-5 tw-h-5" />}
            color="tw-text-purple-600"
          />
        </div>

        {/* Tabs */}
        <div className="tw-flex tw-items-center tw-gap-6 tw-border-b tw-border-gray-200">
          {(['all', 'pending', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tw-pb-3 tw-px-1 tw-text-sm tw-font-medium tw-capitalize tw-transition-colors tw-relative ${
                activeTab === tab 
                  ? 'tw-text-gray-900' 
                  : 'tw-text-gray-500 hover:tw-text-gray-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-h-0.5 tw-bg-gray-900 tw-rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Responses Table */}
        <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-overflow-hidden">
          {isLoading ? (
            <div className="tw-p-8 tw-text-center">
              <div className="tw-inline-block tw-animate-spin tw-rounded-full tw-h-8 tw-w-8 tw-border-b-2 tw-border-gray-900"></div>
              <p className="tw-text-gray-500 tw-mt-2">Loading responses...</p>
            </div>
          ) : filteredResponses.length > 0 ? (
            <div className="tw-overflow-x-auto">
              <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                <thead className="tw-bg-gray-50">
                  <tr>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Patient
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Form
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Status
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Submitted
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Time
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Reviewed
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-right tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
                  {filteredResponses.map((response) => (
                    <tr 
                      key={response.id}
                      className="hover:tw-bg-gray-50 tw-cursor-pointer tw-transition-colors"
                      onClick={() => navigate(`/forms/${response.form}/responses/${response.id}`)}
                    >
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                        <div className="tw-flex tw-items-center">
                          <User className="tw-w-4 tw-h-4 tw-text-gray-400 tw-mr-2" />
                          <div className="tw-text-sm tw-font-medium tw-text-gray-900">
                            {response.patient_name || 'Anonymous'}
                          </div>
                        </div>
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                        <div className="tw-flex tw-items-center">
                          <FileText className="tw-w-4 tw-h-4 tw-text-gray-400 tw-mr-2" />
                          <div className="tw-text-sm tw-text-gray-900">
                            {response.form_title || response.form}
                          </div>
                        </div>
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                        {getStatusBadge(response.status)}
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-500">
                        {response.submitted_at 
                          ? new Date(response.submitted_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-500">
                        {response.completion_time_seconds 
                          ? `${Math.round(response.completion_time_seconds / 60)}m`
                          : '-'}
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                        <span className={`tw-inline-flex tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-rounded-full ${
                          response.status === 'reviewed' 
                            ? 'tw-bg-green-100 tw-text-green-700' 
                            : 'tw-bg-gray-100 tw-text-gray-700'
                        }`}>
                          {response.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                        </span>
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-right tw-text-sm tw-font-medium">
                        <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/forms/${response.form}/responses/${response.id}`);
                            }}
                            className="tw-p-1.5 tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-gray-100 tw-rounded-lg tw-transition-colors"
                            title="View Response"
                          >
                            <Eye className="tw-w-4 tw-h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/forms/${response.form}/responses/${response.id}`);
                            }}
                            className="tw-p-1.5 tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-gray-100 tw-rounded-lg tw-transition-colors"
                            title="Download PDF"
                          >
                            <Download className="tw-w-4 tw-h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(response.id, e)}
                            className="tw-p-1.5 tw-text-red-400 hover:tw-text-red-600 hover:tw-bg-red-50 tw-rounded-lg tw-transition-colors"
                            title="Delete Response"
                          >
                            <Trash2 className="tw-w-4 tw-h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="tw-text-center tw-py-12">
              <FileText className="tw-w-12 tw-h-12 tw-text-gray-300 tw-mx-auto tw-mb-3" />
              <p className="tw-text-gray-500">No {activeTab !== 'all' ? activeTab : ''} responses found</p>
            </div>
          )}
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={() => refetch()}
          className="tw-fixed tw-bottom-6 tw-right-6 tw-p-4 tw-bg-gray-900 tw-text-white tw-rounded-full tw-shadow-lg hover:tw-bg-gray-800 tw-transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="tw-w-5 tw-h-5" />
        </button>
        
        {/* Delete Confirmation Modal */}
        {deleteConfirm.open && (
          <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
            <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-max-w-sm tw-w-full tw-mx-4">
              <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-2">Confirm Delete</h3>
              <p className="tw-text-sm tw-text-gray-500 tw-mb-6">Are you sure you want to delete this response? This action cannot be undone.</p>
              <div className="tw-flex tw-gap-3 tw-justify-end">
                <button
                  onClick={() => setDeleteConfirm({ open: false, id: null })}
                  className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 tw-bg-gray-100 tw-rounded-lg hover:tw-bg-gray-200 tw-transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-bg-red-600 tw-rounded-lg hover:tw-bg-red-700 tw-transition-colors disabled:tw-opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};