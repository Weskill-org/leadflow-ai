
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Mail, MoreHorizontal, MapPin, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { RealEstateEditLeadDialog } from './RealEstateEditLeadDialog';
import { RealEstateLeadDetailsDialog } from './RealEstateLeadDetailsDialog';
import { SiteVisitDateTimeDialog } from './SiteVisitDateTimeDialog';
import { SiteVisitCameraDialog } from './SiteVisitCameraDialog';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCompany } from '@/hooks/useCompany';

export interface RealEstateLead {
  id: string;
  company_id: string | null;
  created_by_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  lead_source: string | null;
  pre_sales_owner_id: string | null;
  sales_owner_id: string | null;
  post_sales_owner_id: string | null;
  property_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  property_size: string | null;
  purpose: string | null;
  possession_timeline: string | null;
  broker_name: string | null;
  property_name: string | null;
  unit_number: string | null;
  deal_value: number | null;
  commission_percentage: number | null;
  commission_amount: number | null;
  lead_profile: Record<string, any>;
  notes: string | null;
  status: string;
  status_metadata: Record<string, any>;
  site_visit_photos: Array<{
    url: string;
    timestamp: string;
    lat: number;
    lng: number;
    verified: boolean;
  }>;
  revenue_projected: number | null;
  revenue_received: number | null;
  payment_link: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  pre_sales_owner?: { full_name: string | null } | null;
  sales_owner?: { full_name: string | null } | null;
  post_sales_owner?: { full_name: string | null } | null;
}

interface RealEstateLeadsTableProps {
  leads: RealEstateLead[];
  loading: boolean;
  selectedLeads: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  owners?: { label: string; value: string }[];
  onRefetch: () => void;
}

interface ProfileLevel {
  id: string;
  label: string;
  children: ProfileLevel[];
}

export function RealEstateLeadsTable({
  leads,
  loading,
  selectedLeads,
  onSelectionChange,
  owners = [],
  onRefetch
}: RealEstateLeadsTableProps) {
  const { statuses, getStatusColor } = useLeadStatuses();
  const { company } = useCompany();
  const [editingLead, setEditingLead] = useState<RealEstateLead | null>(null);
  const [viewingLead, setViewingLead] = useState<RealEstateLead | null>(null);
  const [siteVisitDialogLead, setSiteVisitDialogLead] = useState<RealEstateLead | null>(null);
  const [cameraDialogLead, setCameraDialogLead] = useState<RealEstateLead | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ leadId: string; status: string } | null>(null);
  const queryClient = useQueryClient();

  // New state for Notes editing
  const [notesBuffer, setNotesBuffer] = useState<Record<string, string>>({});

  // Fetch Profiling Config
  const { data: profilingConfig } = useQuery({
    queryKey: ['lead-profiling-config', company?.id],
    queryFn: async () => {
      if (!company?.id) return null;
      const { data, error } = await supabase
        .from('lead_profiling_config')
        .select('config')
        .eq('company_id', company.id)
        .eq('industry', 'real_estate')
        .maybeSingle();

      if (error) {
        console.error('Error fetching profiling config', error);
        return null;
      }
      return data?.config as { levels: ProfileLevel[] } | null;
    },
    enabled: !!company?.id
  });

  // Flatten profiling config for Select options
  const profileOptions = useMemo(() => {
    if (!profilingConfig?.levels) return [];

    const options: { label: string; value: string; path: string[] }[] = [];

    // Recursive function to build paths
    const traverse = (levels: ProfileLevel[], currentPath: string[], currentLabels: string[]) => {
      levels.forEach(level => {
        const newPath = [...currentPath, level.id];
        const newLabels = [...currentLabels, level.label];

        // If it's a leaf node or has no children (or based on business logic, maybe any node can be selected?)
        // Assuming we select leaf nodes or nodes that represent a complete profile state
        if (level.children.length === 0) {
          options.push({
            label: newLabels.join(' > '),
            value: JSON.stringify(newPath), // Store path as value
            path: newLabels
          });
        } else {
          traverse(level.children, newPath, newLabels);
        }
      });
    };

    traverse(profilingConfig.levels, [], []);
    return options;
  }, [profilingConfig]);

  const handleUpdateField = async (leadId: string, field: keyof RealEstateLead, value: any) => {
    try {
      const { error } = await supabase
        .from('leads_real_estate')
        .update({ [field]: value })
        .eq('id', leadId);

      if (error) throw error;
      toast.success(`${field.toString().replace(/_/g, ' ')} updated`);
      onRefetch(); // Verify if we want full refetch or optimistic update. Refetch is safer.
    } catch (error) {
      console.error(`Error updating ${field}: `, error);
      toast.error(`Failed to update ${field} `);
    }
  };

  const handleProfileChange = async (leadId: string, pathJson: string) => {
    try {
      const pathIds = JSON.parse(pathJson);
      // Reconstruct the profile object. 
      // We don't know the exact schema of `lead_profile` JSON required by backend/logic, 
      // but typically it preserves the structure or keys. 
      // Based on `ManageLeadProfiling`, it seems tree based.
      // Based on `RealEstateLeadDetailsDialog`, it renders key-value pairs.
      // We'll try to map the config levels to keys if possible, or just store a flat object?
      // The details dialog iterates `Object.entries`.
      // Let's create a map like { "Level 1": "Value 1", "Level 2": "Value 2" }

      const newProfile: Record<string, any> = {};

      let currentLevels = profilingConfig?.levels;
      pathIds.forEach((id: string, index: number) => {
        const levelNode = currentLevels?.find(l => l.id === id);
        if (levelNode) {
          // We need a key for this level. The config doesn't seem to have explicit "Category Names" for levels other than the node labels themselves.
          // But usually, the top level is "Category", next "Type", etc.
          // Let's just use generic keys or the node parents? 
          // Actually, looking at the previous stored data in details dialog (if any), it showed "key: value".
          // Let's assume we store the path content.
          // To make it look good, let's use the ID or a generated key 'level_${index}'? 
          // OR, maybe the user wants the path.
          // Let's use the Level Label as Value, and maybe "Category", "Sub Category", "Specification" as keys if we can infer?
          // Since we don't have metadata for keys, let's use a flat structure with numeric keys? No that's ugly.
          // Let's use the node ID as key? No.
          // Let's use the structure: { [levelNode.label]: "Selected" } ? No confusing.

          // BEST GUESS: The `lead_profile` should reflect the selection path. 
          // Let's store: { "Selection": "Path > To > Item" } ? Too simple. 
          // Let's store { "Level 1": "Residential", "Level 2": "2 BHK" ... }
          newProfile[`Level ${index + 1} `] = levelNode.label;

          currentLevels = levelNode.children;
        }
      });

      await handleUpdateField(leadId, 'lead_profile', newProfile);

    } catch (e) {
      console.error("Error updating profile", e);
      toast.error("Failed to update profile");
    }
  };


  const handleStatusChange = async (leadId: string, newStatus: string, metadata?: Record<string, any>) => {
    // Check if status requires date/time input
    if ((newStatus === 'site_visit' || newStatus === 'request_callback') && !metadata) {
      setPendingStatus({ leadId, status: newStatus });
      setSiteVisitDialogLead(leads.find(l => l.id === leadId) || null);
      return;
    }

    try {
      const updateData: any = { status: newStatus };
      if (metadata) {
        updateData.status_metadata = metadata;
      }

      const { error } = await supabase
        .from('leads_real_estate')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['real-estate-leads'] });
      onRefetch();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSiteVisitConfirm = async (dateTime: Date) => {
    if (!pendingStatus || !siteVisitDialogLead) return;

    const metadata: Record<string, any> = {
      scheduled_at: dateTime.toISOString(),
    };

    if (pendingStatus.status === 'request_callback') {
      metadata.rcb_display = `RCB - ${format(dateTime, 'dd MMM yyyy, hh:mm a')} `;
    }

    await handleStatusChange(pendingStatus.leadId, pendingStatus.status, metadata);
    setSiteVisitDialogLead(null);
    setPendingStatus(null);
  };

  const getOwnerName = (ownerId: string | null, ownerObj?: { full_name: string | null } | null) => {
    if (ownerObj?.full_name) return ownerObj.full_name;
    if (!ownerId) return '-';
    return owners.find(o => o.value === ownerId)?.label || 'Unknown';
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return '-';
    const formatNum = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
      return `₹${n.toLocaleString()} `;
    };
    if (min && max) return `${formatNum(min)} - ${formatNum(max)} `;
    if (min) return `${formatNum(min)} +`;
    return `Up to ${formatNum(max!)} `;
  };

  const getStatusDisplay = (lead: RealEstateLead) => {
    const status = statuses.find(s => s.value === lead.status);
    const label = status?.label || lead.status;

    if (lead.status === 'request_callback' && lead.status_metadata?.rcb_display) {
      return lead.status_metadata.rcb_display;
    }

    if (lead.status === 'site_visit' && lead.status_metadata?.scheduled_at) {
      return `Site Visit - ${format(new Date(lead.status_metadata.scheduled_at), 'dd MMM, hh:mm a')} `;
    }

    return label;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No leads found. Add your first real estate lead to get started!</p>
      </div>
    );
  }

  const allSelected = leads.length > 0 && leads.every((lead) => selectedLeads.has(lead.id));

  const toggleAll = () => {
    if (allSelected) {
      const newSelected = new Set(selectedLeads);
      leads.forEach((lead) => newSelected.delete(lead.id));
      onSelectionChange(newSelected);
    } else {
      const newSelected = new Set(selectedLeads);
      leads.forEach((lead) => newSelected.add(lead.id));
      onSelectionChange(newSelected);
    }
  };

  const toggleOne = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </TableHead>
              <TableHead className="font-semibold min-w-[150px]">Name</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Contact</TableHead>
              <TableHead className="font-semibold min-w-[120px]">Property Type</TableHead>
              <TableHead className="font-semibold min-w-[120px]">Budget</TableHead>
              <TableHead className="font-semibold min-w-[120px]">Location</TableHead>
              <TableHead className="font-semibold min-w-[200px]">Lead Profile</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Status</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Pre-Sales</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Sales</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Post-Sales</TableHead>
              <TableHead className="font-semibold min-w-[200px]">Notes</TableHead>
              <TableHead className="font-semibold min-w-[120px]">Date</TableHead>
              <TableHead className="font-semibold w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id} className="group">
                <TableCell>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedLeads.has(lead.id)}
                    onChange={() => toggleOne(lead.id)}
                  />
                </TableCell>
                <TableCell className="font-medium align-top py-3">{lead.name}</TableCell>
                <TableCell className="align-top py-3">
                  <div className="flex flex-col gap-1">
                    {lead.phone && (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-top py-3">
                  <Badge variant="outline">{lead.property_type || '-'}</Badge>
                </TableCell>
                <TableCell className="align-top py-3">{formatBudget(lead.budget_min, lead.budget_max)}</TableCell>
                <TableCell className="align-top py-3">
                  {lead.preferred_location ? (
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" /> {lead.preferred_location}
                    </span>
                  ) : '-'}
                </TableCell>
                {/* Lead Profile: Nested Dropdown Edit */}
                <TableCell className="align-top py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-full justify-start px-2 font-normal text-xs border-transparent hover:border-input focus:border-input p-0"
                      >
                        {lead.lead_profile && Object.keys(lead.lead_profile).length > 0 ? (
                          <span className="truncate">{Object.values(lead.lead_profile).filter(Boolean).join(' > ')}</span>
                        ) : <span className="text-muted-foreground opacity-50">Select Profile</span>}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[200px]">
                      {profilingConfig?.levels?.map((level) => {
                        const renderLevel = (currLevel: ProfileLevel, path: string[]) => {
                          const newPath = [...path, currLevel.id];
                          if (currLevel.children && currLevel.children.length > 0) {
                            return (
                              <DropdownMenuSub key={currLevel.id}>
                                <DropdownMenuSubTrigger className="text-xs">
                                  {currLevel.label}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {currLevel.children.map(child => renderLevel(child, newPath))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            );
                          }
                          return (
                            <DropdownMenuItem
                              key={currLevel.id}
                              className="text-xs"
                              onClick={() => handleProfileChange(lead.id, JSON.stringify(newPath))}
                            >
                              {currLevel.label}
                            </DropdownMenuItem>
                          );
                        };
                        return renderLevel(level, []);
                      }) || <div className="p-2 text-xs text-muted-foreground">No profiles configured</div>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                <TableCell className="align-top py-3">
                  <Select
                    value={lead.status}
                    onValueChange={(value) => handleStatusChange(lead.id, value)}
                  >
                    <SelectTrigger
                      className="w-[140px] h-8 text-white border-0 text-xs"
                      style={{ backgroundColor: getStatusColor(lead.status) }}
                    >
                      <SelectValue>{getStatusDisplay(lead)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem
                          key={status.id}
                          value={status.value}
                          className="capitalize"
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Pre-Sales Owner: Inline Edit */}
                <TableCell className="align-top py-3">
                  <Select
                    value={lead.pre_sales_owner_id || 'unassigned'}
                    onValueChange={(val) => handleUpdateField(lead.id, 'pre_sales_owner_id', val === 'unassigned' ? null : val)}
                  >
                    <SelectTrigger className="h-8 w-full border-transparent hover:border-input focus:border-input bg-transparent text-xs p-0 px-2 justify-start font-normal">
                      {lead.pre_sales_owner?.full_name || owners.find(o => o.value === lead.pre_sales_owner_id)?.label || <span className="text-muted-foreground opacity-50">Assign</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {owners.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Sales Owner: Inline Edit */}
                <TableCell className="align-top py-3">
                  <Select
                    value={lead.sales_owner_id || 'unassigned'}
                    onValueChange={(val) => handleUpdateField(lead.id, 'sales_owner_id', val === 'unassigned' ? null : val)}
                  >
                    <SelectTrigger className="h-8 w-full border-transparent hover:border-input focus:border-input bg-transparent text-xs p-0 px-2 justify-start font-normal">
                      {lead.sales_owner?.full_name || owners.find(o => o.value === lead.sales_owner_id)?.label || <span className="text-muted-foreground opacity-50">Assign</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {owners.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Post-Sales Owner: Inline Edit */}
                <TableCell className="align-top py-3">
                  <Select
                    value={lead.post_sales_owner_id || 'unassigned'}
                    onValueChange={(val) => handleUpdateField(lead.id, 'post_sales_owner_id', val === 'unassigned' ? null : val)}
                  >
                    <SelectTrigger className="h-8 w-full border-transparent hover:border-input focus:border-input bg-transparent text-xs p-0 px-2 justify-start font-normal">
                      {lead.post_sales_owner?.full_name || owners.find(o => o.value === lead.post_sales_owner_id)?.label || <span className="text-muted-foreground opacity-50">Assign</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {owners.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Notes: Inline Edit */}
                <TableCell className="align-top py-3">
                  <Textarea
                    className="min-h-[60px] text-xs resize-none border-transparent hover:border-input focus:border-input bg-transparent p-2 shadow-none"
                    placeholder="Add notes..."
                    value={notesBuffer[lead.id] !== undefined ? notesBuffer[lead.id] : (lead.notes || '')}
                    onChange={(e) => setNotesBuffer(prev => ({ ...prev, [lead.id]: e.target.value }))}
                    onBlur={(e) => {
                      if (lead.notes !== e.target.value) {
                        handleUpdateField(lead.id, 'notes', e.target.value);
                      }
                      // Clear buffer to revert to props if update fails (or clean up memory), but mostly to sync with refetch
                      const newBuffer = { ...notesBuffer };
                      delete newBuffer[lead.id];
                      setNotesBuffer(newBuffer);
                    }}
                  />
                </TableCell>

                <TableCell className="align-top py-3 text-sm">
                  {format(new Date(lead.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="align-top py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem onClick={() => setViewingLead(lead)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {lead.status === 'site_visit' && (
                        <DropdownMenuItem onClick={() => setCameraDialogLead(lead)}>
                          📸 Capture Site Visit Photo
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={lead.status}
                            onValueChange={(value) => handleStatusChange(lead.id, value)}
                          >
                            {statuses.map((status) => (
                              <DropdownMenuRadioItem
                                key={status.id}
                                value={status.value}
                                className="capitalize"
                              >
                                {status.label}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RealEstateEditLeadDialog
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        lead={editingLead}
        onSuccess={onRefetch}
      />

      <RealEstateLeadDetailsDialog
        open={!!viewingLead}
        onOpenChange={(open) => !open && setViewingLead(null)}
        lead={viewingLead}
        owners={owners}
      />

      <SiteVisitDateTimeDialog
        open={!!siteVisitDialogLead}
        onOpenChange={(open) => {
          if (!open) {
            setSiteVisitDialogLead(null);
            setPendingStatus(null);
          }
        }}
        statusType={pendingStatus?.status === 'request_callback' ? 'callback' : 'site_visit'}
        onConfirm={handleSiteVisitConfirm}
      />

      <SiteVisitCameraDialog
        open={!!cameraDialogLead}
        onOpenChange={(open) => !open && setCameraDialogLead(null)}
        lead={cameraDialogLead}
        onSuccess={onRefetch}
      />
    </>
  );
}
