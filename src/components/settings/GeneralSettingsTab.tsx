import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, GraduationCap, Building2, Heart, Shield, Car, Landmark, ShoppingCart, Plane, Code, CheckCircle2, AlertTriangle } from 'lucide-react';
import { INDUSTRIES, INDUSTRY_CHANGE_FEE, IndustryType, getIndustryById } from '@/config/industries';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Building2,
  Heart,
  Shield,
  Car,
  Landmark,
  ShoppingCart,
  Plane,
  Code,
};

export default function GeneralSettingsTab() {
  const { company, refetch, isCompanyAdmin } = useCompany();
  const { toast } = useToast();

  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showChangeDialog, setShowChangeDialog] = useState(false);

  // Get current industry from company
  const currentIndustry = (company as any)?.industry as IndustryType | null;
  const isLocked = (company as any)?.industry_locked === true;

  useEffect(() => {
    if (currentIndustry) {
      setSelectedIndustry(currentIndustry);
    }
  }, [currentIndustry]);

  const handleSetIndustry = async () => {
    if (!selectedIndustry || !company) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          industry: selectedIndustry,
          industry_locked: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Industry Set Successfully",
        description: `Your CRM is now configured for ${getIndustryById(selectedIndustry)?.name}. This setting is now locked.`,
      });

      refetch();
      setShowConfirmDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set industry",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestChange = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('change-industry');

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Industry Change Request Accepted",
        description: `Fee deducted. You can now select a new industry.`,
      });

      refetch();
      setShowChangeDialog(false);
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to process request",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isCompanyAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                CRM Industry Configuration
                {isLocked && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Locked
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isLocked
                  ? "Your CRM industry is set. To change it, a fee of ₹10,000 applies."
                  : "Select your business industry. This is a one-time setup that customizes your CRM layout and features."
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLocked && currentIndustry ? (
            <div className="space-y-6">
              {/* Current Industry Display */}
              <div className="p-6 rounded-xl border-2 border-primary/50 bg-primary/5">
                <div className="flex items-start gap-4">
                  {(() => {
                    const industry = getIndustryById(currentIndustry);
                    const IconComponent = industry ? iconMap[industry.icon] : null;
                    return (
                      <>
                        <div className="p-3 rounded-lg bg-primary/10">
                          {IconComponent && <IconComponent className="h-8 w-8 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            {industry?.name}
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </h3>
                          <p className="text-muted-foreground">{industry?.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {industry?.features.map((feature) => (
                              <Badge key={feature} variant="outline">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Change Industry Option */}
              <div className="p-4 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Need to change your industry?</p>
                    <p className="text-xs text-muted-foreground">
                      Changing industry after setup requires reconfiguration and a fee of ₹{INDUSTRY_CHANGE_FEE.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowChangeDialog(true)}>
                    Request Change
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <RadioGroup
                value={selectedIndustry || ''}
                onValueChange={(val) => setSelectedIndustry(val as IndustryType)}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {INDUSTRIES.map((industry) => {
                  const IconComponent = iconMap[industry.icon];
                  const isSelected = selectedIndustry === industry.id;

                  return (
                    <Label
                      key={industry.id}
                      htmlFor={industry.id}
                      className={`
                        relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${isSelected
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        }
                      `}
                    >
                      <RadioGroupItem
                        value={industry.id}
                        id={industry.id}
                        className="absolute top-3 right-3"
                      />
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                          {IconComponent && <IconComponent className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />}
                        </div>
                        <h4 className="font-medium">{industry.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {industry.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {industry.features.slice(0, 2).map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-[10px]">
                            {feature}
                          </Badge>
                        ))}
                        {industry.features.length > 2 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{industry.features.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  ⚠️ This selection cannot be changed for free after confirmation.
                </p>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!selectedIndustry}
                  className="gradient-primary"
                >
                  Confirm Industry Selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Industry Selection</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to set your CRM industry to <strong>{getIndustryById(selectedIndustry!)?.name}</strong>.
                </p>
                <p className="text-amber-600 dark:text-amber-400">
                  ⚠️ This is a one-time setup. Changing it later will require a fee of ₹{INDUSTRY_CHANGE_FEE.toLocaleString('en-IN')}.
                </p>
                <p>Are you sure you want to proceed?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetIndustry} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, Set Industry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Industry Dialog */}
      <AlertDialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Industry Request</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Changing your CRM industry after the initial setup requires:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>A reconfiguration fee of <strong>₹{INDUSTRY_CHANGE_FEE.toLocaleString('en-IN')}</strong></li>
                  <li>Potential data migration (some fields may not transfer)</li>
                  <li>Review by our support team</li>
                </ul>
                <p>Would you like to proceed with the change request?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestChange}>
              Request Change (₹{INDUSTRY_CHANGE_FEE.toLocaleString('en-IN')})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
