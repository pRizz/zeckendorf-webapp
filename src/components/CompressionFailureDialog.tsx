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

interface CompressionFailureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalSize: number;
  beSize: number;
  leSize: number;
}

export const CompressionFailureDialog = ({
  open,
  onOpenChange,
  originalSize,
  beSize,
  leSize,
}: CompressionFailureDialogProps): JSX.Element => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compression Not Beneficial</DialogTitle>
          <DialogDescription>
            The Zeckendorf compression algorithm did not produce smaller files than the original for both endianness options.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Original file size:</span>
              <span className="text-sm font-mono">{formatBytes(originalSize)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Big endian compressed size:</span>
              <span className="text-sm font-mono text-muted-foreground">{formatBytes(beSize)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Little endian compressed size:</span>
              <span className="text-sm font-mono text-muted-foreground">{formatBytes(leSize)}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Zeckendorf compression works best on certain types of data. This file's data distribution doesn't benefit from Zeckendorf compression.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

