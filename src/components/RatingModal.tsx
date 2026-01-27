import { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { clsx } from 'clsx';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  rateeName: string;
  rateeRole: 'freelancer' | 'employer';
}

export function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  rateeName,
  rateeRole,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(rating, comment);
      // Reset form
      setRating(0);
      setComment('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setComment('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Rate ${rateeName}`}
      size="md"
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || rating === 0}
          >
            Submit Rating
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Rating Stars */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            How would you rate this {rateeRole}?
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                disabled={isSubmitting}
              >
                <Star
                  className={clsx(
                    'w-10 h-10 transition-colors',
                    (hoveredRating >= star || rating >= star)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600 hover:text-gray-500'
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-3 text-lg font-semibold text-white">
                {rating} / 5
              </span>
            )}
          </div>
          {rating > 0 && (
            <p className="mt-2 text-sm text-gray-400">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="rating-comment" className="block text-sm font-medium text-gray-300 mb-2">
            Review (Optional)
          </label>
          <textarea
            id="rating-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Share your experience working with ${rateeName}...`}
            rows={4}
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={1000}
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Share details about communication, quality, and professionalism</span>
            <span>{comment.length} / 1000</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            Your rating will be recorded on the blockchain and cannot be changed. Please be honest and fair.
          </p>
        </div>
      </div>
    </Modal>
  );
}
