import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { RequestCard } from './RequestCard';
import { Search, Filter, Plus, RefreshCw, SortAsc, SortDesc } from 'lucide-react';
import { useRequests } from '../../hooks/useRequests';
import type {
  MaintenanceRequest,
  ListRequestsQuery,
  RequestStatus,
  RequestType,
  RequestPriority,
} from '../../types/requests';

interface RequestListProps {
  onCreateRequest?: () => void;
  onEditRequest?: (request: MaintenanceRequest) => void;
  onDeleteRequest?: (request: MaintenanceRequest) => void;
  onAssignRequest?: (request: MaintenanceRequest) => void;
  onStatusUpdate?: (request: MaintenanceRequest) => void;
  onViewRequest?: (request: MaintenanceRequest) => void;
  userRole?: string;
  showCreateButton?: boolean;
}

export const RequestList = ({
  onCreateRequest,
  onEditRequest,
  onDeleteRequest,
  onAssignRequest,
  onStatusUpdate,
  onViewRequest,
  userRole = 'employee',
  showCreateButton = true,
}: RequestListProps) => {
  const [filters, setFilters] = useState<ListRequestsQuery>({
    limit: 20,
    offset: 0,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: requestsResponse, isLoading, refetch } = useRequests(filters);

  const allRequests = requestsResponse?.data?.requests || [];
  const totalCount = requestsResponse?.data?.totalCount || 0;

  // Filter requests based on search query
  const requests = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return allRequests;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return allRequests.filter(
      (request) =>
        request.subject.toLowerCase().includes(query) ||
        request.description?.toLowerCase().includes(query) ||
        false ||
        request.equipmentName.toLowerCase().includes(query) ||
        request.status.toLowerCase().includes(query) ||
        request.priority.toLowerCase().includes(query) ||
        request.requestType.toLowerCase().includes(query) ||
        request.id.toLowerCase().includes(query)
    );
  }, [allRequests, debouncedSearchQuery]);

  const handleFilterChange = (key: keyof ListRequestsQuery, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filters change
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      limit: 20,
      offset: 0,
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  const handleLoadMore = () => {
    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20),
    }));
  };

  const toggleSortDirection = () => {
    setFilters((prev) => ({
      ...prev,
      orderDirection: prev.orderDirection === 'desc' ? 'asc' : 'desc',
    }));
  };

  const getStatusCounts = () => {
    const counts = {
      total: requests.length,
      new: requests.filter((r) => r.status === 'New').length,
      inProgress: requests.filter((r) => r.status === 'In Progress').length,
      repaired: requests.filter((r) => r.status === 'Repaired').length,
      scrap: requests.filter((r) => r.status === 'Scrap').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Requests</h1>
          <p className="text-muted-foreground">
            Manage and track maintenance requests across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {showCreateButton && onCreateRequest && (
            <Button onClick={onCreateRequest}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.new}</div>
            <div className="text-sm text-muted-foreground">New</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.repaired}</div>
            <div className="text-sm text-muted-foreground">Repaired</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statusCounts.scrap}</div>
            <div className="text-sm text-muted-foreground">Scrap</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests by subject, description, equipment, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                }}
              >
                ×
              </Button>
            )}
            {searchQuery !== debouncedSearchQuery && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value: RequestStatus | 'all') =>
                    handleFilterChange('status', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Repaired">Repaired</SelectItem>
                    <SelectItem value="Scrap">Scrap</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={filters.requestType || 'all'}
                  onValueChange={(value: RequestType | 'all') =>
                    handleFilterChange('requestType', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="Corrective">Corrective</SelectItem>
                    <SelectItem value="Preventive">Preventive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={filters.priority || 'all'}
                  onValueChange={(value: RequestPriority | 'all') =>
                    handleFilterChange('priority', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <div className="flex gap-2">
                  <Select
                    value={filters.orderBy || 'createdAt'}
                    onValueChange={(
                      value: 'createdAt' | 'updatedAt' | 'priority' | 'scheduledDate'
                    ) => handleFilterChange('orderBy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Created</SelectItem>
                      <SelectItem value="updatedAt">Updated</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="scheduledDate">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={toggleSortDirection}>
                    {filters.orderDirection === 'desc' ? (
                      <SortDesc className="h-4 w-4" />
                    ) : (
                      <SortAsc className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(filters.status ||
            filters.requestType ||
            filters.priority ||
            debouncedSearchQuery.trim()) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Active filters:</span>
              {debouncedSearchQuery.trim() && (
                <Badge variant="secondary">Search: "{debouncedSearchQuery}"</Badge>
              )}
              {filters.status && <Badge variant="secondary">Status: {filters.status}</Badge>}
              {filters.requestType && (
                <Badge variant="secondary">Type: {filters.requestType}</Badge>
              )}
              {filters.priority && <Badge variant="secondary">Priority: {filters.priority}</Badge>}
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs">
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              {debouncedSearchQuery.trim() ? (
                <div>
                  <div className="text-muted-foreground mb-4">
                    No requests found matching "{debouncedSearchQuery}"
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                    }}
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="text-muted-foreground mb-4">No maintenance requests found</div>
                  {showCreateButton && onCreateRequest && (
                    <Button onClick={onCreateRequest}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first request
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onEdit={onEditRequest}
                  onDelete={onDeleteRequest}
                  onAssign={onAssignRequest}
                  onStatusUpdate={onStatusUpdate}
                  onView={onViewRequest}
                  userRole={userRole}
                />
              ))}
            </div>

            {/* Load More */}
            {requests.length < totalCount && (
              <div className="text-center">
                <Button variant="outline" onClick={handleLoadMore}>
                  Load More ({requests.length} of {totalCount})
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
