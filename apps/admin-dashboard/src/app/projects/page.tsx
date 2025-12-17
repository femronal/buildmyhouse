'use client';

import { useState } from 'react';
import { useProjects, useUpdateProjectStatus } from '@/hooks/useProjects';
import { Search, Filter, ArrowUpDown, Building2 } from 'lucide-react';

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const filters = {
    status: statusFilter,
    search: searchQuery || undefined,
    sortBy,
    sortOrder,
  };

  const { data, isLoading } = useProjects(page, 20, filters);
  const updateStatus = useUpdateProjectStatus();

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    if (confirm(`Change project status to ${newStatus}?`)) {
      await updateStatus.mutateAsync({ projectId, status: newStatus });
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading projects...</div>;
  }

  const projects = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-poppins">Project Monitoring</h1>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="budget">Sort by Budget</option>
            <option value="progress">Sort by Progress</option>
          </select>

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((project: any) => (
          <div key={project.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-gray-400" />
                <div>
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  <p className="text-gray-600">{project.address}</p>
                </div>
              </div>
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(project.id, e.target.value)}
                className="px-3 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-semibold">${project.budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Spent</p>
                <p className="font-semibold">${project.spent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <p className="font-semibold">{project.progress}%</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || statusColors.draft}`}>
                {project.status}
              </span>
              <span className="text-sm text-gray-500">
                Homeowner: {project.homeowner?.fullName || 'N/A'}
              </span>
              {project.generalContractor && (
                <span className="text-sm text-gray-500">
                  Contractor: {project.generalContractor.fullName}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= pagination.totalPages}
          className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

