import React, { useState } from 'react';
import { Star, X, MessageSquare, ThumbsUp } from 'lucide-react';

/**
 * ⭐ Service Rating Modal
 * 
 * مودال لتقييم الخدمة.
 * يظهر للعميل عند اكتمال المهمة.
 */

export default function ServiceRatingModal({ isOpen, onClose, onSubmit }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => {
            onSubmit({ rating, comment });
            onClose();
        }, 2000);
    };

    if (isSubmitted) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                <div className="bg-card rounded-2xl w-full max-w-md p-8 text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ThumbsUp className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">شكراً لتقييمك!</h3>
                    <p className="text-muted-foreground">رأيك يهمنا ويساعدنا على تحسين خدماتنا.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground">تقييم الخدمة</h3>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="text-center mb-8">
                        <p className="text-muted-foreground mb-4">كيف كانت تجربتك معنا؟</p>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={`w-10 h-10 ${star <= (hoverRating || rating)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-muted-foreground/30'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-brand-blue mt-2 h-5">
                            {rating === 5 ? 'ممتاز! 🤩' :
                                rating === 4 ? 'جيد جداً 😄' :
                                    rating === 3 ? 'جيد 🙂' :
                                        rating === 2 ? 'مقبول 😐' :
                                            rating === 1 ? 'سيء 😞' : ''}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                ملاحظات إضافية (اختياري)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows="3"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                                placeholder="أخبرنا المزيد عن تجربتك..."
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={rating === 0}
                            className="w-full py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            إرسال التقييم
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
