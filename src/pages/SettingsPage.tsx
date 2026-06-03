import { useState, useEffect } from "react";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Settings,
  Users,
  Clock,
  Plus,
  Trash2,
  Star,
  Shield,
  Phone,
  Mail,
  User,
  Save,
  AlertCircle,
} from "lucide-react";
import type { TrustedContact, Profile } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContactForm {
  name: string;
  phone: string;
  email: string;
  relationship: string;
}

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [checkInInterval, setCheckInInterval] = useState("10");
  const [notifications, setNotifications] = useState(true);

  const form = useForm<ContactForm>({
    defaultValues: { name: "", phone: "", email: "", relationship: "" },
  });
  const profileForm = useForm({
    defaultValues: {
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    },
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("trusted_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setContacts((data as TrustedContact[]) || []);
        setLoading(false);
      });
    if (profile?.check_in_interval)
      setCheckInInterval(String(profile.check_in_interval));
  }, [user, profile]);

  const handleAddContact = async (data: ContactForm) => {
    if (!user) return;
    if (!data.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!data.phone?.trim() && !data.email?.trim()) {
      toast.error("Phone or email required");
      return;
    }
    setAddingContact(true);
    const { data: contact, error } = await supabase
      .from("trusted_contacts")
      .insert({
        user_id: user.id,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        relationship: data.relationship?.trim() || null,
        is_primary: contacts.length === 0,
      })
      .select()
      .maybeSingle();
    setAddingContact(false);
    if (error) {
      toast.error("Failed to add contact");
      return;
    }
    setContacts((prev) => [...prev, contact as TrustedContact]);
    form.reset();
    setShowAddForm(false);
    toast.success(`${data.name} added as trusted contact`);
  };

  const handleDeleteContact = async () => {
    if (!deleteTarget) return;
    await supabase.from("trusted_contacts").delete().eq("id", deleteTarget);
    setContacts((prev) => prev.filter((c) => c.id !== deleteTarget));
    setDeleteTarget(null);
    toast.success("Contact removed");
  };

  const handleSetPrimary = async (contactId: string) => {
    await supabase
      .from("trusted_contacts")
      .update({ is_primary: false })
      .eq("user_id", user!.id);
    await supabase
      .from("trusted_contacts")
      .update({ is_primary: true })
      .eq("id", contactId);
    setContacts((prev) =>
      prev.map((c) => ({ ...c, is_primary: c.id === contactId })),
    );
    toast.success("Primary contact updated");
  };

  const handleSaveProfile = async (data: {
    full_name: string;
    phone: string;
  }) => {
    if (!user) return;
    setSavingProfile(true);
    await supabase
      .from("profiles")
      .update({
        full_name: data.full_name?.trim() || null,
        phone: data.phone?.trim() || null,
        check_in_interval: parseInt(checkInInterval),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSavingProfile(false);
    await refreshProfile();
    toast.success("Profile updated");
  };

  const username = profile?.email?.replace("@miaoda.com", "") || "";

  return (
    <AppLayout
      title="SETTINGS"
      subtitle="Profile, Trusted Contacts & Preferences"
    >
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {/* Profile */}
        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-primary" />
              USER PROFILE
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form
              onSubmit={profileForm.handleSubmit(handleSaveProfile)}
              className="space-y-4"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="font-mono font-bold text-lg text-primary">
                    {username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {username}
                  </p>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] border-primary/30 text-primary py-0"
                  >
                    {profile?.role?.toUpperCase() || "USER"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-normal text-muted-foreground">
                    Full Name
                  </Label>
                  <Input
                    placeholder="Your full name"
                    {...profileForm.register("full_name")}
                    defaultValue={profile?.full_name || ""}
                    className="bg-muted/30 border-border font-mono text-sm px-3"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-normal text-muted-foreground">
                    Phone
                  </Label>
                  <Input
                    placeholder="+91 XXXXX XXXXX"
                    {...profileForm.register("phone")}
                    defaultValue={profile?.phone || ""}
                    className="bg-muted/30 border-border font-mono text-sm px-3"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                className="font-mono text-xs"
                disabled={savingProfile}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {savingProfile ? "SAVING..." : "SAVE PROFILE"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-primary" />
              SAFETY PREFERENCES
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-foreground">
                  Default Check-in Interval
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  How often agents prompt for safety confirmation
                </p>
              </div>
              <Select
                value={checkInInterval}
                onValueChange={setCheckInInterval}
              >
                <SelectTrigger className="w-28 bg-muted/30 border-border font-mono text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["5", "10", "15", "20", "30"].map((v) => (
                    <SelectItem key={v} value={v} className="font-mono text-xs">
                      {v} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-foreground">
                  Emergency Notifications
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Allow agents to send emergency alerts
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-foreground">
                  Escalation Tier 3 Protocol
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Auto-trigger full emergency after 2 missed tiers
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>
            <Button
              size="sm"
              className="font-mono text-xs"
              onClick={() => {
                supabase
                  .from("profiles")
                  .update({ check_in_interval: parseInt(checkInInterval) })
                  .eq("id", user!.id);
                toast.success("Preferences saved");
              }}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              SAVE PREFERENCES
            </Button>
          </CardContent>
        </Card>

        {/* Trusted Contacts */}
        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-primary" />
                TRUSTED CONTACTS
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] border-border py-0"
                >
                  {contacts.length}
                </Badge>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm((p) => !p)}
                className="font-mono text-[10px] h-7 border-border hover:border-primary/40"
              >
                <Plus className="w-3 h-3 mr-1" />
                ADD
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {contacts.length === 0 && !loading && (
              <div className="flex items-center gap-2 p-3 rounded-sm border border-warning-custom/20 bg-warning-custom/5">
                <AlertCircle className="w-4 h-4 text-warning-custom shrink-0" />
                <p className="font-mono text-xs text-muted-foreground">
                  No trusted contacts. Add at least one contact for emergency
                  escalation.
                </p>
              </div>
            )}

            {loading ? (
              <Skeleton className="h-16 bg-muted" />
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-start gap-3 p-3 rounded-sm border border-border/40 bg-card/30"
                >
                  <div className="w-8 h-8 rounded-sm bg-muted/30 border border-border flex items-center justify-center shrink-0">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {contact.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs font-semibold text-foreground">
                        {contact.name}
                      </p>
                      {contact.is_primary && (
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] py-0 border-primary/30 text-primary"
                        >
                          PRIMARY
                        </Badge>
                      )}
                      {contact.relationship && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {contact.relationship}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                      {contact.phone && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </span>
                      )}
                      {contact.email && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!contact.is_primary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground hover:text-primary"
                        onClick={() => handleSetPrimary(contact.id)}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-emergency"
                      onClick={() => setDeleteTarget(contact.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            {/* Add Contact Form */}
            {showAddForm && (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddContact)}
                  className="space-y-3 p-3 rounded-sm border border-primary/20 bg-primary/5 animate-fade-in-up"
                >
                  <p className="font-mono text-xs font-semibold text-primary">
                    NEW TRUSTED CONTACT
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-normal text-muted-foreground">
                            Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Full name"
                              {...field}
                              className="bg-muted/30 border-border font-mono text-sm px-3 h-8"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-emergency" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-normal text-muted-foreground">
                            Relationship
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Sister, Friend"
                              {...field}
                              className="bg-muted/30 border-border font-mono text-sm px-3 h-8"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-normal text-muted-foreground">
                            Phone
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+91 XXXXX XXXXX"
                              {...field}
                              className="bg-muted/30 border-border font-mono text-sm px-3 h-8"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-normal text-muted-foreground">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="contact@email.com"
                              {...field}
                              className="bg-muted/30 border-border font-mono text-sm px-3 h-8"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="font-mono text-xs h-8"
                      disabled={addingContact}
                    >
                      {addingContact ? "ADDING..." : "ADD CONTACT"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs h-8 border-border"
                      onClick={() => {
                        setShowAddForm(false);
                        form.reset();
                      }}
                    >
                      CANCEL
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Security info */}
        <Card className="glass-card border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-mono text-xs font-semibold text-foreground">
                  Data Security
                </p>
                <p className="font-mono text-[11px] text-muted-foreground text-pretty">
                  All safety data is encrypted at rest. Location data is only
                  stored during active missions. Contact information is never
                  shared with third parties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">
              Remove Contact?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-sm">
              This contact will no longer receive emergency notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs">
              CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="font-mono text-xs bg-destructive hover:bg-destructive/90"
            >
              REMOVE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
