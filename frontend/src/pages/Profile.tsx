import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguageStore } from "@/store/language";

export function Profile() {
  const { user, updateUsername, changePassword } = useAuth();
  const { toast } = useToast();
  const { content } = useLanguageStore();

  // Username state
  const [username, setUsername] = useState(user?.username || "");
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setUsernameLoading(true);
    try {
      await updateUsername(username);
      toast({
        title: content.profile.toasts.usernameUpdated,
        description: content.profile.toasts.usernameUpdatedDesc,
      });
    } catch (error) {
      toast({
        title: content.profile.toasts.error,
        description: error instanceof Error ? error.message : content.profile.toasts.updateFailed,
        variant: "destructive",
      });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: content.profile.toasts.error,
        description: content.profile.toasts.passwordMismatch,
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast({
        title: content.profile.toasts.passwordChanged,
        description: content.profile.toasts.passwordChangedDesc,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        title: content.profile.toasts.error,
        description: error instanceof Error ? error.message : content.profile.toasts.passwordChangeFailed,
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{content.profile.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {content.profile.subtitle}
          </p>
        </div>

        {/* Username Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {content.profile.userInformation}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{content.profile.usernameSection.label}</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={content.profile.usernameSection.placeholder}
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  title="Username can only contain letters, numbers, and underscores"
                />
                <p className="text-xs text-muted-foreground">
                  {content.profile.usernameSection.hint}
                </p>
              </div>
              <Button
                type="submit"
                disabled={
                  usernameLoading ||
                  !username.trim() ||
                  username === user?.username
                }
              >
                {usernameLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {content.profile.usernameSection.updateButton}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Section - Only show if user has password */}
        {user?.hasPassword && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {content.profile.passwordSection.title}
              </CardTitle>
              <CardDescription>
                {content.profile.passwordSection.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">{content.profile.passwordSection.currentPasswordLabel}</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder={content.profile.passwordSection.currentPasswordPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{content.profile.passwordSection.newPasswordLabel}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={content.profile.passwordSection.newPasswordPlaceholder}
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{content.profile.passwordSection.confirmPasswordLabel}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={content.profile.passwordSection.confirmPasswordPlaceholder}
                    minLength={8}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    passwordLoading ||
                    !oldPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {passwordLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {content.profile.passwordSection.changeButton}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
