export default function NotesDisplay({ notes }: { "notes": string[] }) {
  if (!notes || notes.length === 0) {
    return <p className="text-center text-gray-500 italic">No messages were left for you.</p>;
  }

  return (
    <div className="space-y-4">
      {notes.map((note, index) => (
        <div 
          key={index} 
          className={`p-4 rounded-lg relative ${index % 2 === 0 ? 'bg-blue-50 ml-0 mr-4' : 'bg-green-50 ml-4 mr-0'}`}
        >
          <p className="text-gray-800 font-handwriting">"{note}"</p>
          <div 
            className={`absolute bottom-0 w-4 h-4 transform rotate-45 ${index % 2 === 0 ? 'bg-blue-50 -left-2' : 'bg-green-50 -right-2'}`}
          ></div>
        </div>
      ))}
    </div>
  );
}