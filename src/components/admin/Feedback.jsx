import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiStar,
  FiMessageSquare,
  FiAlertCircle,
  FiX,
  FiSmile,
  FiFrown
} from 'react-icons/fi';
import { feedbackService } from '../../services/feedbackService';

const ratingLabels = {
  5: 'Excellent',
  4: 'Good',
  3: 'Fair',
  2: 'Needs Improvement',
  1: 'Poor'
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '—';
  }

  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const renderStars = (rating) => {
  if (rating === null || rating === undefined) {
    return <span className="text-sm text-gray-500">Not rated</span>;
  }

  const rounded = Math.round(rating * 10) / 10;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={`w-4 h-4 ${rounded >= star ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          style={{ fill: rounded >= star ? 'currentColor' : 'none' }}
        />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700">{rounded.toFixed(1)}</span>
    </div>
  );
};

const truncate = (text, limit = 120) => {
  if (!text) {
    return 'No feedback message provided.';
  }
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}…`;
};

const Feedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const fetchFeedback = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const result = await feedbackService.getAllFeedback();
      if (result.success) {
        const normalized = (result.data || []).map((item, index) => {
          const parsedRating = Number(item.rating);
          const rating = Number.isFinite(parsedRating) ? parsedRating : null;
          const rawDate = item.date || item.date_submitted || item.created_at || null;
          const parsedDate = rawDate ? new Date(rawDate) : null;
          const isValidDate = parsedDate && !Number.isNaN(parsedDate.getTime());

          return {
            key: item.id ?? `${item.userId ?? 'user'}-${rawDate ?? index}`,
            id: item.id ?? null,
            userId: item.userId ?? null,
            userName: item.userName && item.userName.trim() ? item.userName : 'Anonymous User',
            barangay: item.barangay && item.barangay.trim() ? item.barangay : 'Not specified',
            rating,
            message: item.message && item.message.trim() ? item.message.trim() : 'No feedback message provided.',
            type: item.type && item.type.trim() ? item.type : 'General Feedback',
            submittedAtRaw: rawDate,
            submittedAt: isValidDate ? parsedDate : null
          };
        });

        normalized.sort((a, b) => {
          if (a.submittedAt && b.submittedAt) {
            return b.submittedAt - a.submittedAt;
          }
          if (a.submittedAt) return -1;
          if (b.submittedAt) return 1;
          return 0;
        });

        setFeedbackList(normalized);
      } else {
        setFeedbackList([]);
        setError(result.error || result.message || 'Failed to load feedback.');
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      setFeedbackList([]);
      setError(err.message || 'Failed to load feedback.');
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const feedbackTypes = useMemo(() => {
    const types = new Set();
    feedbackList.forEach((item) => {
      if (item.type) {
        types.add(item.type);
      }
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }, [feedbackList]);

  const filteredFeedback = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return feedbackList.filter((item) => {
      const matchesSearch =
        query.length === 0 ||
        [item.userName, item.barangay, item.message, item.type]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query));

      const matchesType = selectedType === 'all' || item.type === selectedType;

      const matchesRating = selectedRating === 'all'
        ? true
        : item.rating !== null && Number(item.rating) === Number(selectedRating);

      return matchesSearch && matchesType && matchesRating;
    });
  }, [feedbackList, searchTerm, selectedType, selectedRating]);

  const stats = useMemo(() => {
    const rated = feedbackList.filter((item) => item.rating !== null);
    const ratingsCount = rated.length;
    const totalRatings = rated.reduce((sum, item) => sum + item.rating, 0);
    const average = ratingsCount ? totalRatings / ratingsCount : 0;

    const positive = rated.filter((item) => item.rating >= 4).length;
    const neutral = rated.filter((item) => item.rating === 3).length;
    const negative = rated.filter((item) => item.rating > 0 && item.rating <= 2).length;

    const latestDate = feedbackList.reduce((latest, item) => {
      if (!item.submittedAt) return latest;
      if (!latest) return item.submittedAt;
      return item.submittedAt > latest ? item.submittedAt : latest;
    }, null);

    return {
      total: feedbackList.length,
      ratedCount: ratingsCount,
      average,
      positive,
      neutral,
      negative,
      latestDate
    };
  }, [feedbackList]);

  const handleRefresh = () => {
    fetchFeedback({ silent: true });
  };

  if (loading) {
    return (
      <div className="w-full h-full p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-green-700 font-medium">Loading feedback records...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-green-700 mb-2">Resident Feedback</h1>
        <p className="text-gray-600 max-w-3xl">
          Monitor community sentiment, review detailed comments, and track satisfaction trends from residents across barangays.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-1" />
          <div>
            <p className="font-medium">{error}</p>
            <button
              onClick={() => fetchFeedback()}
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-900"
            >
              <FiRefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Feedback</span>
            <FiMessageSquare className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <p className="text-sm text-gray-500 mt-1">Across all barangays</p>
          <p className="text-xs text-gray-400 mt-2">
            {stats.latestDate ? `Last entry ${formatDate(stats.latestDate)}` : 'Awaiting first submission'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Average Rating</span>
            <FiStar className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.ratedCount ? stats.average.toFixed(1) : '—'}</div>
          <p className="text-sm text-gray-500 mt-1">From {stats.ratedCount} rated submissions</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Positive Feedback</span>
            <FiSmile className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.positive}</div>
          <p className="text-sm text-gray-500 mt-1">Ratings 4 and 5</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Needs Attention</span>
            <FiFrown className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.negative}</div>
          <p className="text-sm text-gray-500 mt-1">Ratings 1 and 2</p>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
            <div className="relative md:w-72">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, barangay, or message"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[160px]"
              >
                <option value="all">All Categories</option>
                {feedbackTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={selectedRating}
                onChange={(event) => setSelectedRating(event.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[150px]"
              >
                <option value="all">All Ratings</option>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} Star{rating > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
          >
            <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="px-6 py-4">
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-12">
              <FiAlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback found</h3>
              <p className="text-gray-500">{searchTerm ? 'No feedback matches your filters.' : 'Feedback entries will appear here once residents submit their responses.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Resident</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFeedback.map((feedback) => (
                    <tr key={feedback.key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <FiUser className="w-5 h-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{feedback.userName}</div>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <FiMapPin className="w-3 h-3 mr-1" />
                              {feedback.barangay}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{feedback.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {feedback.rating !== null ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-xs">
                              {feedback.rating.toFixed(1)}
                            </span>
                            <span>{ratingLabels[Math.round(feedback.rating)] || 'Rated'}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not rated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(feedback.submittedAt || feedback.submittedAtRaw)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-sm">
                        <p className="text-sm text-gray-700">{truncate(feedback.message, 140)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedFeedback(feedback)}
                          className="text-green-600 hover:text-green-800 font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Feedback Details</h2>
                <p className="text-sm text-gray-500">Submitted {formatDate(selectedFeedback.submittedAt || selectedFeedback.submittedAtRaw)}</p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Resident</p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <FiUser className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{selectedFeedback.userName}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <FiMapPin className="w-4 h-4 mr-1" />
                        {selectedFeedback.barangay}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Category</p>
                  <p className="text-base font-medium text-gray-800">{selectedFeedback.type}</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Rating</p>
                <div className="flex items-center gap-3">
                  {renderStars(selectedFeedback.rating)}
                  {selectedFeedback.rating !== null && (
                    <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                      {ratingLabels[Math.round(selectedFeedback.rating)] || 'Rated'}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Message</p>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-gray-700 leading-relaxed">
                  {selectedFeedback.message}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
