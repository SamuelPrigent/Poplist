'use client';

import { AlertTriangle, Check, Eye, EyeOff, Loader2, Trash2, Upload, User, X } from 'lucide-react';
import { ResponsiveConfirmDialog } from '@/components/ui/responsive-confirm-dialog';
import { Img as Image } from '@/components/ui/Img';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { useIsMounted } from '@/hooks/useIsMounted';
import { users as usersApi } from '@/api';
import { useLanguageStore } from '@/store/language';

export default function AccountPage() {
  const { user, updateUsername, changePassword, deleteAccount, refetch } = useAuth();
  const { content } = useLanguageStore();
  const navigate = useNavigate();

  // Username state
  const [username, setUsername] = useState(user?.username || '');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameCheckError, setUsernameCheckError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Password visibility state
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password error state
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Avatar state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);

  // Client-side mount state (for hydration consistency)
  const mounted = useIsMounted();

  // Update username when user changes
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user?.username]);

  // Username availability check with debounce
  const checkUsernameAvailability = useCallback(
    async (usernameToCheck: string) => {
      // Skip check if username is same as current
      if (usernameToCheck === user?.username) {
        setUsernameCheckError(null);
        return;
      }

      // Validate format first
      if (usernameToCheck.length < 3 || usernameToCheck.length > 20) {
        setUsernameCheckError(content.profile.usernameSection.validation.lengthError);
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
        setUsernameCheckError(content.profile.usernameSection.validation.formatError);
        return;
      }

      setUsernameChecking(true);
      try {
        const response = await fetch(`/api/auth/username/check/${usernameToCheck}`);
        const data = await response.json();

        if (!data.available) {
          setUsernameCheckError(content.profile.usernameSection.validation.alreadyTaken);
        } else {
          setUsernameCheckError(null);
        }
      } catch (error) {
        console.error('Failed to check username availability:', error);
        setUsernameCheckError(null); // Don't block on network error
      } finally {
        setUsernameChecking(false);
      }
    },
    [user?.username, content]
  );

  // Debounced username check
  useEffect(() => {
    if (!username || username === user?.username) {
      setUsernameCheckError(null);
      return;
    }

    const timer = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 300);

    return () => clearTimeout(timer);
  }, [username, user?.username, checkUsernameAvailability]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setUsernameLoading(true);
    try {
      await updateUsername(username);
      toast.success(content.profile.toasts.usernameUpdated, {
        description: content.profile.toasts.usernameUpdatedDesc,
      });
    } catch (error) {
      toast.error(content.profile.toasts.error, {
        description: error instanceof Error ? error.message : content.profile.toasts.updateFailed,
      });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(content.profile.toasts.passwordMismatch);
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success(content.profile.toasts.passwordChanged, {
        description: content.profile.toasts.passwordChangedDesc,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : content.profile.toasts.passwordChangeFailed;
      setPasswordError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount(deleteConfirmation);
      toast.success(content.profile.toasts.accountDeleted, {
        description: content.profile.toasts.accountDeletedDesc,
      });
      setDeleteDialogOpen(false);
      navigate({ to: '/' as never });
    } catch (error) {
      toast.error(content.profile.toasts.error, {
        description:
          error instanceof Error ? error.message : content.profile.toasts.accountDeleteFailed,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(content.profile.toasts.error, {
        description: content.profile.avatarSection.validation.invalidFileType,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(content.profile.toasts.error, {
        description: content.profile.avatarSection.validation.fileTooLarge,
      });
      return;
    }

    setAvatarUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          await usersApi.uploadAvatar(base64String);

          // Refresh user data to get the new avatar URL
          await refetch();

          toast.success(content.profile.avatarSection.toasts.updated, {
            description: content.profile.avatarSection.toasts.updatedDesc,
          });
        } catch (error) {
          toast.error(content.profile.toasts.error, {
            description:
              error instanceof Error
                ? error.message
                : content.profile.avatarSection.validation.uploadFailed,
          });
        } finally {
          setAvatarUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(content.profile.toasts.error, {
        description: content.profile.avatarSection.validation.readFailed,
      });
      setAvatarUploading(false);
      return error;
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarDeleting(true);
    try {
      await usersApi.deleteAvatar();

      // Refresh user data to remove the avatar URL
      await refetch();

      toast.success(content.profile.avatarSection.toasts.deleted, {
        description: content.profile.avatarSection.toasts.deletedDesc,
      });
    } catch (error) {
      toast.error(content.profile.toasts.error, {
        description:
          error instanceof Error
            ? error.message
            : content.profile.avatarSection.validation.deleteFailed,
      });
    } finally {
      setAvatarDeleting(false);
    }
  };

  return (
    <div className="container mx-auto mt-6 mb-28 px-4 py-8 max-[749px]:mt-2 max-[749px]:py-5">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold max-[749px]:text-2xl">{content.profile.title}</h1>
          <p className="text-muted-foreground mt-2 max-[749px]:text-sm">
            {content.profile.subtitle}
          </p>
        </div>

        {/* Avatar Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{content.profile.avatarSection.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {content.profile.avatarSection.description}
                </p>
              </div>

              <div className="flex items-center gap-6 max-[749px]:flex-col max-[749px]:items-start max-[749px]:gap-4">
                {/* Avatar Display */}
                <div className="relative shrink-0">
                  {mounted && user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.username || 'Avatar'}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-full">
                      <User className="text-muted-foreground h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* Avatar Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <label htmlFor="avatar-upload">
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={avatarUploading || avatarDeleting}
                      />
                      <Button
                        className="focus-visible:ring-offset-background cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
                        type="button"
                        variant="outline"
                        disabled={avatarUploading || avatarDeleting}
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        {avatarUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {content.profile.avatarSection.uploading}
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {mounted && user?.avatarUrl
                              ? content.profile.avatarSection.changeButton
                              : content.profile.avatarSection.uploadButton}
                          </>
                        )}
                      </Button>
                    </label>

                    {mounted && user?.avatarUrl && (
                      <Button
                        className="focus-visible:ring-offset-background cursor-pointer focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-white"
                        type="button"
                        variant="outline"
                        disabled={avatarUploading || avatarDeleting}
                        onClick={handleAvatarDelete}
                      >
                        {avatarDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {content.profile.avatarSection.deleting}
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {content.profile.avatarSection.deleteButton}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {content.profile.avatarSection.hint}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Username Section */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{content.profile.usernameSection.label}</Label>
                <div className="relative">
                  <Input
                    autoComplete="name"
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder={content.profile.usernameSection.placeholder}
                    minLength={3}
                    maxLength={20}
                    pattern="[a-zA-Z0-9_]+"
                    title="Username can only contain letters, numbers, and underscores"
                    className={usernameCheckError ? 'border-red-500' : ''}
                  />
                  {username && username !== user?.username && (
                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                      {usernameChecking ? (
                        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                      ) : usernameCheckError ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                {usernameCheckError && <p className="text-sm text-red-500">{usernameCheckError}</p>}
              </div>
              <Button
                className="focus-visible:ring-offset-background cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
                type="submit"
                disabled={
                  usernameLoading ||
                  usernameChecking ||
                  !username.trim() ||
                  username === user?.username ||
                  !!usernameCheckError
                }
              >
                {usernameLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {content.profile.usernameSection.updateButton}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Section - Only show if user has password (mounted check for hydration) */}
        {mounted && user?.hasPassword && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">
                    {content.profile.passwordSection.currentPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="oldPassword"
                      type={
                        oldPassword.length === 0 ? 'text' : showOldPassword ? 'text' : 'password'
                      }
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      placeholder={content.profile.passwordSection.currentPasswordPlaceholder}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                      tabIndex={-1}
                    >
                      {showOldPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    {content.profile.passwordSection.newPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={
                        newPassword.length === 0 ? 'text' : showNewPassword ? 'text' : 'password'
                      }
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder={content.profile.passwordSection.newPasswordPlaceholder}
                      minLength={8}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {content.profile.passwordSection.confirmPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={
                        confirmPassword.length === 0
                          ? 'text'
                          : showConfirmPassword
                            ? 'text'
                            : 'password'
                      }
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder={content.profile.passwordSection.confirmPasswordPlaceholder}
                      minLength={8}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  className="cursor-pointer"
                  type="submit"
                  disabled={passwordLoading || !oldPassword || !newPassword || !confirmPassword}
                >
                  {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {content.profile.passwordSection.changeButton}
                </Button>

                {passwordError && (
                  <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
                    {passwordError}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {/* Delete Account Section */}
        <Card className="border-red-500/50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-red-500">
                  {content.profile.deleteSection.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {content.profile.deleteSection.description}
                </p>
              </div>
              <Button
                className="focus-visible:ring-offset-background cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                {content.profile.deleteSection.deleteButton}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog (responsive : modale desktop / drawer mobile) */}
      <ResponsiveConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={open => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteConfirmation('');
        }}
        icon={
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
        }
        title={content.profile.deleteSection.dialogTitle}
        titleClassName="text-red-500"
        description={content.profile.deleteSection.dialogDescription}
        loading={deleteLoading}
        confirmVariant="destructive"
        confirmDisabled={deleteConfirmation !== 'confirmer'}
        cancelLabel={content.profile.deleteSection.cancel}
        confirmLabel={
          <>
            {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {deleteLoading
              ? content.profile.deleteSection.deleting
              : content.profile.deleteSection.deleteButton}
          </>
        }
        onConfirm={handleDeleteAccount}
      >
        <div className="space-y-2 pt-2">
          <Label htmlFor="deleteConfirmation">
            {content.profile.deleteSection.confirmationLabel}
          </Label>
          <Input
            id="deleteConfirmation"
            type="text"
            value={deleteConfirmation}
            onChange={e => setDeleteConfirmation(e.target.value)}
            placeholder={content.profile.deleteSection.confirmationPlaceholder}
            disabled={deleteLoading}
          />
        </div>
      </ResponsiveConfirmDialog>
    </div>
  );
}
