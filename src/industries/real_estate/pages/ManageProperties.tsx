import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Coins, Search, Building2, MapPin, Ruler } from 'lucide-react';
import { useRealEstateProperties, RealEstateProperty } from '@/hooks/useRealEstateProperties';
import { useToast } from '@/hooks/use-toast';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// Helper for Smart Combobox - Defined outside to prevent re-renders
const SmartCombobox = ({
    value,
    setValue,
    options,
    open,
    setOpen,
    placeholder,
    label
}: {
    value: string,
    setValue: (v: string) => void,
    options: (string | null)[],
    open: boolean,
    setOpen: (v: boolean) => void,
    placeholder: string,
    label: string
}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value || placeholder}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={`Search ${label}...`}
                        value={value}
                        onValueChange={setValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-sm text-muted-foreground">
                                Type to add new {label}
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => opt && (
                                <CommandItem
                                    key={opt}
                                    value={opt}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === opt ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {opt}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    </div>
);

export default function ManageProperties() {
    const { properties, isLoading, createProperty, updateProperty, deleteProperty } = useRealEstateProperties();
    const { toast } = useToast();

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<RealEstateProperty | null>(null);

    // Form state
    const [category, setCategory] = useState('');
    const [name, setName] = useState('');
    const [sqFt, setSqFt] = useState('');
    const [cost, setCost] = useState('');
    const [availableUnits, setAvailableUnits] = useState('');
    const [location, setLocation] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');

    // Combobox states
    const [openCategory, setOpenCategory] = useState(false);
    const [openLocation, setOpenLocation] = useState(false);
    const [openState, setOpenState] = useState(false);
    const [openCountry, setOpenCountry] = useState(false);

    // Unique lists for autocompletion
    const uniqueCategories = Array.from(new Set(properties?.map(p => p.category).filter(Boolean) || [])).sort();
    const uniqueLocations = Array.from(new Set(properties?.map(p => p.location).filter(Boolean) || [])).sort();
    const uniqueStates = Array.from(new Set(properties?.map(p => p.state).filter(Boolean) || [])).sort();
    const uniqueCountries = Array.from(new Set(properties?.map(p => p.country).filter(Boolean) || [])).sort();

    const handleOpenDialog = (property?: RealEstateProperty) => {
        if (property) {
            setEditingProperty(property);
            setCategory(property.category);
            setName(property.name);
            setSqFt(property.sq_ft?.toString() || '');
            setCost(property.cost?.toString() || '');
            setAvailableUnits(property.available_units?.toString() || '');
            setLocation(property.location || '');
            setState(property.state || '');
            setCountry(property.country || '');
        } else {
            setEditingProperty(null);
            setCategory('');
            setName('');
            setSqFt('');
            setCost('');
            setAvailableUnits('');
            setLocation('');
            setState('');
            setCountry('');
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!category.trim() || !name.trim()) {
            toast({
                title: "Validation Error",
                description: "Category and Name are required.",
                variant: "destructive"
            });
            return;
        }

        const propertyData = {
            category: category.trim(),
            name: name.trim(),
            sq_ft: sqFt ? parseFloat(sqFt) : null,
            cost: cost ? parseFloat(cost) : null,
            available_units: availableUnits ? parseInt(availableUnits) : null,
            location: location.trim() || null,
            state: state.trim() || null,
            country: country.trim() || null,
        };

        try {
            if (editingProperty) {
                await updateProperty.mutateAsync({ id: editingProperty.id, ...propertyData });
            } else {
                await createProperty.mutateAsync(propertyData);
            }
            setIsDialogOpen(false);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this property?')) {
            await deleteProperty.mutateAsync(id);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Properties</h1>
                        <p className="text-muted-foreground">Manage your real estate inventory and listings.</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()} className="gradient-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Property
                    </Button>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
                            <DialogDescription>
                                Add details about the property, location, and pricing.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">

                            {/* Row 1: Category & Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SmartCombobox
                                    label="Category"
                                    value={category}
                                    setValue={setCategory}
                                    options={uniqueCategories}
                                    open={openCategory}
                                    setOpen={setOpenCategory}
                                    placeholder="Select Category..."
                                />
                                <div className="space-y-2">
                                    <Label htmlFor="name">Property Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Sunrise Villa"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Sq Ft & Cost */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sq_ft">Area (Sq Ft)</Label>
                                    <div className="relative">
                                        <Ruler className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="sq_ft"
                                            type="number"
                                            value={sqFt}
                                            onChange={(e) => setSqFt(e.target.value)}
                                            className="pl-8"
                                            placeholder="Area"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cost">Cost (₹)</Label>
                                    <div className="relative">
                                        <Coins className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="cost"
                                            type="number"
                                            value={cost}
                                            onChange={(e) => setCost(e.target.value)}
                                            className="pl-8"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Units & Location */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="units">Available Units</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="units"
                                            type="number"
                                            value={availableUnits}
                                            onChange={(e) => setAvailableUnits(e.target.value)}
                                            className="pl-8"
                                            placeholder="Units"
                                        />
                                    </div>
                                </div>
                                <SmartCombobox
                                    label="Location"
                                    value={location}
                                    setValue={setLocation}
                                    options={uniqueLocations}
                                    open={openLocation}
                                    setOpen={setOpenLocation}
                                    placeholder="City/Area..."
                                />
                            </div>

                            {/* Row 4: State & Country */}
                            <div className="grid grid-cols-2 gap-4">
                                <SmartCombobox
                                    label="State"
                                    value={state}
                                    setValue={setState}
                                    options={uniqueStates}
                                    open={openState}
                                    setOpen={setOpenState}
                                    placeholder="State..."
                                />
                                <SmartCombobox
                                    label="Country"
                                    value={country}
                                    setValue={setCountry}
                                    options={uniqueCountries}
                                    open={openCountry}
                                    setOpen={setOpenCountry}
                                    placeholder="Country..."
                                />
                            </div>

                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={!category || !name}>
                                {(createProperty.isPending || updateProperty.isPending) && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Save Property
                            </Button>
                        </DialogFooter>
                    </DialogContent>

                </Dialog>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>All Properties</CardTitle>
                            <CardDescription>
                                {properties?.length || 0} properties listed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {properties?.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No properties found. Add your first property.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead>Cost</TableHead>
                                            <TableHead>Units</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {properties?.map((property) => (
                                            <TableRow key={property.id}>
                                                <TableCell>
                                                    <Badge variant="outline">{property.category}</Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{property.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-muted-foreground">
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        {property.location || '-'}, {property.state || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{property.sq_ft ? `${property.sq_ft.toLocaleString()} sq ft` : '-'}</TableCell>
                                                <TableCell>₹{property.cost?.toLocaleString() || '-'}</TableCell>
                                                <TableCell>{property.available_units || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(property)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(property.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
