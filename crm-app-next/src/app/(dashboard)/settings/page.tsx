"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const user = {
    firstName: session?.user?.firstName ?? "",
    lastName: session?.user?.lastName ?? "",
    email: session?.user?.email ?? "",
    avatar: session?.user?.image ?? undefined,
    role: session?.user?.role ?? "sales_rep",
  };
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);

  const handleSave = () => {
    toast.success("Profile updated");
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="size-20">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-lg">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            onClick={() => toast.info("Avatar upload not available in demo")}
          >
            <Camera className="size-3.5" />
          </button>
        </div>
        <div>
          <p className="font-medium">{firstName} {lastName}</p>
          <p className="text-sm text-muted-foreground capitalize">{user.role.replace("_", " ")}</p>
        </div>
      </div>

      <Separator />

      {/* Form */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <Separator />

      {/* Password */}
      <div>
        <h4 className="font-medium">Change Password</h4>
        <p className="text-sm text-muted-foreground mb-4">Update your password</p>
        <div className="grid gap-4 max-w-sm">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Notification Prefs (quick) */}
      <div>
        <h4 className="font-medium">Quick Preferences</h4>
        <div className="mt-3 space-y-3">
          {[
            { label: "Email notifications for new deals", defaultChecked: true },
            { label: "Email notifications for assigned tasks", defaultChecked: true },
            { label: "Weekly activity summary", defaultChecked: false },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between">
              <span className="text-sm">{pref.label}</span>
              <Switch defaultChecked={pref.defaultChecked} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave}>Save Changes</Button>
        <Button variant="outline" onClick={() => {
          setFirstName(user.firstName);
          setLastName(user.lastName);
          setEmail(user.email);
        }}>
          Reset
        </Button>
      </div>
    </div>
  );
}
