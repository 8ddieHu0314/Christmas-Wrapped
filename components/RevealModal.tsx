'use client';

import { motion, AnimatePresence } from 'framer-motion';
import NotesDisplay from './NotesDisplay';

interface RevealModalProps {
  data: any;
  onClose: () => void;
}

export default function RevealModal({ data, onClose }: RevealModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ "scale": 0.5, "opacity": 0 }}
        animate={{ "scale": 1, "opacity": 1 }}
        exit={{ "scale": 0.5, "opacity": 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative border-4 border-christmas-gold"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold"
        >
          &times;
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-christmas font-bold text-christmas-red">
            {data.type === 'notes' ? 'Heartfelt Messages' : 'The Winner Is...'}
          </h2>
        </div>

        {data.type === 'notes' ? (
          <NotesDisplay notes={data.data} />
        ) : (
          <div className="space-y-6">
            {data.data.length > 0 ? (
              data.data.map((option: any) => (
                <div key={option.id} className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{option.title}</h3>
                  <p className="text-gray-600 mb-3">{option.description}</p>
                  <div className="inline-block bg-christmas-green text-white px-3 py-1 rounded-full text-sm font-bold">
                    {option.voteCount} Votes
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 italic">No votes were cast for this category yet.</p>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="bg-christmas-red text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}