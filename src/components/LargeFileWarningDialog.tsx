import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { FILE_SIZE_WARNING_THRESHOLD } from "@/lib/constants";

interface LargeFileWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File;
  action: "compress" | "decompress";
  onProceed: () => void;
}

export const LargeFileWarningDialog = ({
  open,
  onOpenChange,
  file,
  action,
  onProceed,
}: LargeFileWarningDialogProps): JSX.Element => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Large File Warning</DialogTitle>
          <DialogDescription>
            The file you selected ({file.name}) is larger than {formatBytes(FILE_SIZE_WARNING_THRESHOLD)} ({formatBytes(file.size)}). Processing files larger than this limit may cause high CPU usage, memory issues, or cause your browser tab to lock up.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Do you want to proceed with {action === "compress" ? "compression" : "decompression"} anyway?
          </p>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={onProceed}>
            Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

