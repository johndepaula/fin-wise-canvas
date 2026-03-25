export function SuggestionDropdown({ suggestions, onSelect }: { suggestions: string[]; onSelect: (v: string) => void }) {
  if (!suggestions.length) return null;
  return (
    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-32 overflow-y-auto">
      {suggestions.map((s) => (
        <button key={s} type="button" className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors" onClick={() => onSelect(s)}>
          {s}
        </button>
      ))}
    </div>
  );
}
