import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GuestDialog } from "@/components/auth/guest-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSignOut } from "@/hooks/user/use-sign-out";

interface LogoutFlowProps {
  isUserAnonymous: boolean | null | undefined;
  children: (props: {
    handleLogout: () => void;
    isPending: boolean;
  }) => React.ReactNode;
}

export function LogoutFlow({ isUserAnonymous, children }: LogoutFlowProps) {
  const { mutate: signOut, isPending } = useSignOut();

  const [showGuestAlert, setShowGuestAlert] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(false);

  const handleLogout = () => {
    if (isUserAnonymous) {
      setShowGuestAlert(true);
    } else {
      signOut(undefined, {
        onSuccess: () => {
          toast.success("Logged out successfully.");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    }
  };

  return (
    <>
      {/* Render prop pattern */}
      {children({ handleLogout, isPending })}

      <AlertDialog open={showGuestAlert} onOpenChange={setShowGuestAlert}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Are you talking to me?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              guest session data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowGuestDialog(true)}>
              Save progress
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => signOut()}>
              Yes, goodbye!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GuestDialog open={showGuestDialog} onOpenChange={setShowGuestDialog} />
    </>
  );
}
