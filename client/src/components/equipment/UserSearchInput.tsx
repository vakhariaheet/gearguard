import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, User } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/services/apiClient';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  emailAddress: string;
  role?: string;
}

interface UserSearchInputProps {
  value?: string;
  onUserSelect: (userId: string, userInfo: { name: string; email: string }) => void;
  onClear: () => void;
  placeholder?: string;
  selectedUserInfo?: { name: string; email: string };
}

export const UserSearchInput = ({
  value,
  onUserSelect,
  onClear,
  placeholder = 'Search employees...',
  selectedUserInfo,
}: UserSearchInputProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users when debounced term changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2) {
        setUsers([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<{
          success: boolean;
          data: { users: User[]; totalCount: number };
        }>(
          `/api/teams/search-users?query=${encodeURIComponent(debouncedSearchTerm)}&role=employee`
        );

        if (response.success && response.data) {
          setUsers(response.data.users || []);
          setShowDropdown(true);
        } else {
          throw new Error('Search failed');
        }
      } catch (err) {
        console.error('User search error:', err);
        setError('Failed to search users');
        setUsers([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    };

    searchUsers();
  }, [debouncedSearchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);

    // If user clears the input, clear the selection
    if (!newValue.trim() && value) {
      onClear();
    }
  };

  const handleUserSelect = (user: User) => {
    const userName =
      user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddress;

    onUserSelect(user.id, {
      name: userName,
      email: user.emailAddress,
    });

    setSearchTerm('');
    setShowDropdown(false);
    setUsers([]);
  };

  const handleClear = () => {
    setSearchTerm('');
    setUsers([]);
    setShowDropdown(false);
    onClear();
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (searchTerm.trim().length >= 2) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected user display */}
      {value && selectedUserInfo && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md mb-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{selectedUserInfo.name}</div>
            <div className="text-xs text-muted-foreground truncate">{selectedUserInfo.email}</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={value ? 'Search to change employee...' : placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="pl-10"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      {/* Dropdown */}
      {showDropdown && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {isLoading ? 'Searching...' : 'No employees found'}
              </div>
            ) : (
              <div className="py-1">
                {users.map((user) => {
                  const userName =
                    user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.emailAddress;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{userName}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.emailAddress}
                            {user.role && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {user.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
