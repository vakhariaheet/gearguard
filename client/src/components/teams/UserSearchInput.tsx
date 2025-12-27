/**
 * UserSearchInput Component
 * Reusable user search input with autocomplete functionality
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, Loader2, X, User } from 'lucide-react';
import { useSearchUsers } from '@/hooks/useTeams';
import { useDebounce } from '@/hooks/useDebounce';
import type { UserSearchResult } from '@/types/teams';

interface UserSearchInputProps {
  value?: string; // User ID
  onUserSelect: (user: UserSearchResult | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
}

export const UserSearchInput = ({
  value,
  onUserSelect,
  placeholder = 'Search user by email...',
  disabled = false,
  className = '',
  allowClear = true,
}: UserSearchInputProps) => {
  const [emailQuery, setEmailQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [showUserList, setShowUserList] = useState(false);

  // Debounce email search to avoid too many API calls
  const debouncedEmailQuery = useDebounce(emailQuery, 300);

  // Search users when debounced query changes
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(
    debouncedEmailQuery,
    debouncedEmailQuery.length >= 2 && !selectedUser && !disabled
  );

  // Show user list when we have search results and no user is selected
  useEffect(() => {
    const shouldShow = Boolean(
      !selectedUser &&
      debouncedEmailQuery.length >= 2 &&
      searchResults?.data?.users &&
      searchResults.data.users.length > 0 &&
      !disabled
    );
    setShowUserList(shouldShow);
  }, [selectedUser, debouncedEmailQuery, searchResults, disabled]);

  // Clear selection when value prop changes to empty
  useEffect(() => {
    if (!value && selectedUser) {
      setSelectedUser(null);
      setEmailQuery('');
    }
  }, [value, selectedUser]);

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    setEmailQuery(user.email);
    setShowUserList(false);
    onUserSelect(user);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setEmailQuery('');
    setShowUserList(false);
    onUserSelect(null);
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setEmailQuery(inputValue);

    // Clear selected user if email is changed
    if (selectedUser && inputValue !== selectedUser.email) {
      setSelectedUser(null);
      onUserSelect(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected User Display */}
      {selectedUser ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <Avatar className="h-8 w-8">
            <AvatarImage src={selectedUser.profileImageUrl} />
            <AvatarFallback className="text-xs">
              {selectedUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-sm">{selectedUser.name}</div>
            <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
          </div>
          {allowClear && !disabled && (
            <Button type="button" variant="ghost" size="sm" onClick={handleClearSelection}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        /* Search Input */
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={emailQuery}
              onChange={handleEmailInputChange}
              placeholder={placeholder}
              className="pl-10"
              disabled={disabled}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* User Search Results */}
          {showUserList && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults?.data?.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleUserSelect(user)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl} />
                    <AvatarFallback className="text-xs">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {!selectedUser &&
            emailQuery.length >= 2 &&
            !isSearching &&
            (!searchResults?.data?.users || searchResults.data.users.length === 0) && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  No users found matching "{emailQuery}"
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
