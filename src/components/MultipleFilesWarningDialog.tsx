import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MultipleFilesWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MultipleFilesWarningDialog = ({
  open,
  onOpenChange,
}: MultipleFilesWarningDialogProps): JSX.Element => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Multiple Files Not Supported</DialogTitle>
          <DialogDescription>
            Processing multiple files at once is not supported. Please process one file at a time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

