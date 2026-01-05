'use client';

import { motion } from 'framer-motion';
import { X, MessageCircle, User, Sparkles } from 'lucide-react';

interface Answer {
  id: string;
  answer: string;
  voterName: string;
  created_at: string;
}

interface RevealModalProps {
  data: {
    success: boolean;
    category: {
      name: string;
      description: string;
      code: string;
    };
    type: 'answers' | 'notes';
    answers: Answer[];
    summary: string | null;
    totalVotes: number;
  };
  onClose: () => void;
}

export default function RevealModal({ data, onClose }: RevealModalProps) {
  const isPersonalNotes = data.type === 'notes';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-christmas-red to-red-600 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-4 text-6xl">✨</div>
            <div className="absolute bottom-2 right-4 text-6xl">🎄</div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
              <Sparkles size={16} />
              {data.category?.name || 'Category'}
            </div>
            <h2 className="text-2xl md:text-3xl font-christmas font-bold">
              {isPersonalNotes ? 'Heartfelt Messages' : 'Your Friends Say...'}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Summary Section */}
          {data.summary && data.answers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-christmas-gold rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                <MessageCircle size={18} />
                Summary
              </div>
              <p className="text-gray-800 font-medium">{data.summary}</p>
            </motion.div>
          )}

          {/* Answers List */}
          {data.answers.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 font-medium">
                {data.totalVotes} {data.totalVotes === 1 ? 'friend' : 'friends'} voted
              </div>
              
              {data.answers.map((answer, index) => (
                <motion.div
                  key={answer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className={`rounded-xl p-4 border ${
                    isPersonalNotes 
                      ? 'bg-gradient-to-r from-pink-50 to-red-50 border-pink-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isPersonalNotes ? 'bg-pink-200 text-pink-700' : 'bg-christmas-green/20 text-christmas-green'
                    }`}>
                      <User size={16} />
                    </div>
                    <span className="font-medium text-gray-700">{answer.voterName}</span>
                  </div>
                  <p className={`text-gray-800 ${isPersonalNotes ? 'italic' : ''}`}>
                    {isPersonalNotes ? `"${answer.answer}"` : answer.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-gray-500 italic text-lg">
                No votes received yet for this category.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Invite more friends to vote!
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-christmas-red text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
