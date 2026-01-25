interface MessageSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading?: boolean;
  colorClasses?: {
    bg: string;
    border: string;
    text: string;
    hoverBg: string;
    hoverBorder: string;
  };
}

export default function MessageSuggestions({
  suggestions,
  onSuggestionClick,
  isLoading,
  colorClasses = {
    bg: 'bg-white',
    border: 'border-blue-200',
    text: 'text-blue-700',
    hoverBg: 'hover:bg-blue-50',
    hoverBorder: 'hover:border-blue-300',
  },
}: MessageSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-3 px-2">
      <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick(suggestion)}
            disabled={isLoading}
            className={`px-3 py-1.5 text-xs ${colorClasses.bg} border ${colorClasses.border} ${colorClasses.text} rounded-full ${colorClasses.hoverBg} ${colorClasses.hoverBorder} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
