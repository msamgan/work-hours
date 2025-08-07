import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  timeLogId?: number;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  className = "",
  timeLogId
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load existing tags for this time log if timeLogId is provided
  useEffect(() => {
    if (timeLogId) {
      axios.get(`/time-log/${timeLogId}/tags`)
        .then(response => {
          const existingTags = response.data.map((tag: { name: string }) => tag.name);
          onChange(existingTags);
        })
        .catch(error => console.error('Error loading tags:', error));
    }
  }, [timeLogId]);

  // Fetch tag suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get('/tags/autocomplete', {
        params: { query }
      });

      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);

    if (query) {
      fetchSuggestions(query);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Add a tag
  const addTag = (tag: string) => {
    tag = tag.trim();

    if (tag && !value.includes(tag)) {
      const newTags = [...value, tag];
      onChange(newTags);

      // Save to server if timeLogId is provided
      if (timeLogId) {
        axios.post(`/time-log/${timeLogId}/tags`, { tags: newTags })
          .catch(error => console.error('Error saving tags:', error));
      }
    }

    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    const newTags = value.filter(tag => tag !== tagToRemove);
    onChange(newTags);

    // Save to server if timeLogId is provided
    if (timeLogId) {
      axios.post(`/time-log/${timeLogId}/tags`, { tags: newTags })
        .catch(error => console.error('Error saving tags:', error));
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 p-1 border rounded-md ${className}`}>
      {value.map((tag) => (
        <Badge key={tag} className="flex items-center gap-1 px-2 py-1">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="flex items-center justify-center w-4 h-4 text-xs rounded-full hover:bg-gray-200"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}

      <div className="relative flex-1 min-w-[120px]">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={value.length > 0 ? "" : placeholder}
          className="border-0 outline-none focus:ring-0 focus-visible:ring-0 h-8 p-0"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => addTag(suggestion.name)}
              >
                {suggestion.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TagInput;
