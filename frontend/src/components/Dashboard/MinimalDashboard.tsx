import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetResponsesQuery, useDeleteResponseMutation } from '../../store/api/responsesApi';
import {
  Calendar,
  Clock,
  User,
  FileText,
  Eye,
  Trash2,
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle
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

interface ResponseCardProps {
  response: any;
  onView: () => void;
  onDelete: () => void;
}

const ResponseCard: React.FC<ResponseCardProps> = ({ response, onView, onDelete }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'submitted':
        return <CheckCircle className="tw-w-4 tw-h-4" />;
      case 'in_progress':
        return <AlertCircle className="tw-w-4 tw-h-4" />;
      default:
        return <XCircle className="tw-w-4 tw-h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'submitted':
        return 'tw-border-l-emerald-500 tw-text-emerald-600';
      case 'reviewed':
        return 'tw-border-l-blue-500 tw-text-blue-600';
      case 'in_progress':
        return 'tw-border-l-amber-500 tw-text-amber-600';
      default:
        return 'tw-border-l-gray-400 tw-text-gray-500';
    }
  };

  const statusColor = getStatusColor(response.status);

  return (
    <div 
      className={`tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-border-l-4 ${statusColor.split(' ')[0]} tw-p-5 tw-transition-all tw-duration-200 hover:tw-shadow-md hover:tw-translate-y-[-2px] tw-cursor-pointer tw-group`}
      onClick={onView}
    >
      <div className="tw-space-y-4">
        <div className="tw-flex tw-items-start tw-justify-between">
          <div className="tw-flex-1 tw-min-w-0">
            <h3 className="tw-text-base tw-font-medium tw-text-gray-900 tw-truncate">
              {response.patient_name || 'Anonymous Patient'}
            </h3>
            <p className="tw-text-sm tw-text-gray-500 tw-mt-1 tw-flex tw-items-center tw-gap-1">
              <FileText className="tw-w-3 tw-h-3" />
              {response.form_title || response.form}
            </p>
          </div>
          <div className="tw-flex tw-gap-1">
            <button 
              className="tw-p-2 tw-rounded-lg tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-gray-50 tw-transition-colors tw-opacity-0 group-hover:tw-opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              title="View Response"
            >
              <Eye className="tw-w-4 tw-h-4" />
            </button>
            <button 
              className="tw-p-2 tw-rounded-lg tw-text-red-400 hover:tw-text-red-600 hover:tw-bg-red-50 tw-transition-colors tw-opacity-0 group-hover:tw-opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete Response"
            >
              <Trash2 className="tw-w-4 tw-h-4" />
            </button>
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-justify-between tw-text-xs">
          <div className="tw-flex tw-items-center tw-gap-4 tw-text-gray-500">
            <span className="tw-flex tw-items-center tw-gap-1">
              <Calendar className="tw-w-3 tw-h-3" />
              {response.submitted_at 
                ? new Date(response.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Not submitted'}
            </span>
            {response.completion_time_seconds && (
              <span className="tw-flex tw-items-center tw-gap-1">
                <Clock className="tw-w-3 tw-h-3" />
                {Math.round(response.completion_time_seconds / 60)}m
              </span>
            )}
          </div>
          <div className={`tw-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium ${statusColor.split(' ')[1]}`}>
            {getStatusIcon(response.status)}
            <span>{response.status?.replace('_', ' ') || 'pending'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard: React.FC = () => (
  <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-5 tw-animate-pulse">
    <div className="tw-space-y-4">
      <div className="tw-flex tw-items-start tw-justify-between">
        <div className="tw-flex-1">
          <div className="tw-h-5 tw-bg-gray-200 tw-rounded tw-w-32 tw-mb-2"></div>
          <div className="tw-h-4 tw-bg-gray-100 tw-rounded tw-w-48"></div>
        </div>
        <div className="tw-h-8 tw-w-8 tw-bg-gray-100 tw-rounded-lg"></div>
      </div>
      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-gap-4">
          <div className="tw-h-3 tw-bg-gray-100 tw-rounded tw-w-16"></div>
          <div className="tw-h-3 tw-bg-gray-100 tw-rounded tw-w-12"></div>
        </div>
        <div className="tw-h-4 tw-bg-gray-100 tw-rounded tw-w-20"></div>
      </div>
    </div>
  </div>
);

export const MinimalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  
  const { data: responsesData, isLoading, error, refetch } = useGetResponsesQuery({ 
    page_size: 50, 
    ordering: '-submitted_at' 
  });
  
  const [deleteResponse, { isLoading: isDeleting }] = useDeleteResponseMutation();
  
  const responses = responsesData?.results || [];
  
  const handleDelete = async (responseId: string) => {
    setDeleteConfirm({ open: true, id: responseId });
  };
  
  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      try {
        await deleteResponse(deleteConfirm.id).unwrap();
        refetch();
      } catch (error) {
        
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

        {/* Response Cards Grid */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredResponses.length > 0 ? (
            filteredResponses.map((response, index) => (
              <div 
                key={response.id}
                className="tw-animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ResponseCard 
                  response={response}
                  onView={() => navigate(`/forms/${response.form}/responses/${response.id}`)}
                  onDelete={() => handleDelete(response.id)}
                />
              </div>
            ))
          ) : (
            <div className="tw-col-span-full tw-text-center tw-py-12">
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