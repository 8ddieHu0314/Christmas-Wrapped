'use client';

import { motion } from 'framer-motion';
import { X, Trophy, Users, Sparkles } from 'lucide-react';

interface Answer {
  id: string;
  answer: string;
  voteCount: number;
  voters: string[];
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
    winner?: Answer;
    totalVotes: number;
  };
  onClose: () => void;
}

export default function RevealModal({ data, onClose }: RevealModalProps) {
  const isPersonalNotes = data.type === 'notes';

  // Calculate percentage for vote bar
  const getVotePercentage = (voteCount: number) => {
    if (data.totalVotes === 0) return 0;
    return (voteCount / data.totalVotes) * 100;
  };

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
        className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden relative border border-primary/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-4 text-6xl">✨</div>
            <div className="absolute bottom-2 right-4 text-6xl">🎁</div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-1">
              <Sparkles size={16} />
              {data.category?.name || 'Category'}
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              {isPersonalNotes ? 'Heartfelt Messages' : 'Your Friends Say...'}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] bg-background">
          {/* Winner Section */}
          {data.winner && data.answers.length > 0 && !isPersonalNotes && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-2 text-primary font-medium mb-2">
                <Trophy size={18} />
                Top Answer
              </div>
              <p className="text-2xl font-bold text-foreground capitalize">{data.winner.answer}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {data.winner.voteCount} {data.winner.voteCount === 1 ? 'vote' : 'votes'} from {data.winner.voters.join(', ')}
              </p>
            </motion.div>
          )}

          {/* Answers List */}
          {data.answers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <Users size={16} />
                {data.totalVotes} {data.totalVotes === 1 ? 'vote' : 'votes'} total
              </div>
              
              {data.answers.map((answer, index) => (
                <motion.div
                  key={answer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className={`rounded-xl p-4 border relative overflow-hidden ${
                    isPersonalNotes 
                      ? 'bg-gradient-to-r from-pink-900/30 to-red-900/30 border-pink-500/30' 
                      : 'bg-secondary/50 border-border'
                  }`}
                >
                  {/* Vote bar background */}
                  {!isPersonalNotes && (
                    <div 
                      className="absolute inset-0 bg-primary/10 transition-all duration-500"
                      style={{ width: `${getVotePercentage(answer.voteCount)}%` }}
                    />
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg text-foreground capitalize">
                        {isPersonalNotes ? `"${answer.answer}"` : answer.answer}
                      </span>
                      {!isPersonalNotes && (
                        <span className="text-primary font-bold text-lg">
                          {answer.voteCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {answer.voters.length > 0 ? (
                        <>From: {answer.voters.join(', ')}</>
                      ) : (
                        'Anonymous'
                      )}
                    </p>
                  </div>
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
              <p className="text-muted-foreground italic text-lg">
                No votes received yet for this category.
              </p>
              <p className="text-muted-foreground/70 text-sm mt-2">
                Invite more friends to vote!
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-secondary/30">
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
