import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NoFilesWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "compress" | "decompress";
}

export const NoFilesWarningDialog = ({
  open,
  onOpenChange,
  action,
}: NoFilesWarningDialogProps): JSX.Element => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>No File Selected</DialogTitle>
          <DialogDescription>
            No file was selected for {action === "compress" ? "compression" : "decompression"}. Please select a file to process.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

