'use client';

import Link from 'next/link';
import { BarChart3, ChevronLeft, Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useContractorReviewInsights } from '@/hooks/useContractorReviewInsights';

export default function ReviewInsightsPage() {
  const { data, isLoading, error } = useContractorReviewInsights();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load contractor review insights.
        </div>
      </div>
    );
  }

  const totalReviews = data?.totalReviews ?? 0;
  const avgRating = data?.averageRating ?? 0;
  const specialties = data?.specialties ?? [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-poppins">Contractor Review Insights</h1>
          <p className="text-gray-500 mt-1">
            Fast view of rating trends and top reasons by major specialty.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Reviews</p>
          <p className="text-3xl font-bold mt-2 font-poppins">{totalReviews.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Platform Avg Rating</p>
          <p className="text-3xl font-bold mt-2 font-poppins">⭐ {avgRating.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Specialties Tracked</p>
          <p className="text-3xl font-bold mt-2 font-poppins">{specialties.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        {specialties.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            No contractor reviews available yet.
          </div>
        ) : (
          specialties.map((specialty) => (
            <div key={specialty.category} className="bg-white rounded-xl shadow border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-700" />
                  <h2 className="text-lg font-semibold font-poppins">{specialty.label}</h2>
                </div>
                <div className="text-sm text-gray-600">
                  {specialty.totalReviews} reviews • ⭐ {specialty.averageRating.toFixed(1)}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-red-100 bg-red-50/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    <h3 className="text-sm font-semibold text-red-700">Top Low-Rating Reasons (1-3★)</h3>
                  </div>
                  <div className="space-y-2">
                    {specialty.lowReasons.length === 0 ? (
                      <p className="text-sm text-gray-500">No low-rating reasons yet.</p>
                    ) : (
                      specialty.lowReasons.map((item) => (
                        <div key={`${specialty.category}-low-${item.reason}`} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-gray-700">{item.reason}</span>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700 font-medium">
                            {item.count}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-emerald-700">Top High-Rating Reasons (4-5★)</h3>
                  </div>
                  <div className="space-y-2">
                    {specialty.highReasons.length === 0 ? (
                      <p className="text-sm text-gray-500">No high-rating reasons yet.</p>
                    ) : (
                      specialty.highReasons.map((item) => (
                        <div key={`${specialty.category}-high-${item.reason}`} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-gray-700">{item.reason}</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 font-medium">
                            {item.count}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

