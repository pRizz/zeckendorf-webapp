import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { formatElapsedTimeShort } from "@/lib/utils";
import { MAX_GENERATABLE_FILE_SIZE, ZECK_FILE_HEADER_SIZE } from "@/lib/constants";
import type { GeneratingType } from "@/hooks/use-file-generation";

interface CustomDataGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customDataContentSize: string;
  onCustomDataContentSizeChange: (value: string) => void;
  generatingType: GeneratingType;
  elapsedMilliseconds: number;
  validateCustomDataContentSize: (showToasts?: boolean) => number | null;
  onGenerateWellCompressibleBE: () => void;
  onGenerateWellCompressibleLE: () => void;
  onGenerateCompressedBE: () => void;
  onGenerateCompressedLE: () => void;
}

export const CustomDataGenerationDialog = ({
  open,
  onOpenChange,
  customDataContentSize,
  onCustomDataContentSizeChange,
  generatingType,
  elapsedMilliseconds,
  validateCustomDataContentSize,
  onGenerateWellCompressibleBE,
  onGenerateWellCompressibleLE,
  onGenerateCompressedBE,
  onGenerateCompressedLE,
}: CustomDataGenerationDialogProps): JSX.Element => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Custom Sized Data</DialogTitle>
          <DialogDescription>
            Enter the content size in bytes and choose which file type to generate. Each file is generated on-demand when you click its button. <b>For .zeck files, the total file size will be 10 bytes larger due to the header.</b> A maximum of {MAX_GENERATABLE_FILE_SIZE.toLocaleString()} bytes is set due to memory pressure during compression and decompression. Wanna help improve the algorithm? Check out the <a href="https://github.com/pRizz/zeckendorf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Rust code</a> and submit a pull request!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="data-size">Content size in bytes (max {MAX_GENERATABLE_FILE_SIZE.toLocaleString()})</Label>
            <Input
              id="data-size"
              type="number"
              min="1"
              max={MAX_GENERATABLE_FILE_SIZE}
              value={customDataContentSize}
              onChange={(e) => {
                const value = e.target.value;
                const maybeNum = parseInt(value, 10);
                if (value === "" || (!isNaN(maybeNum) && maybeNum > 0 && maybeNum <= MAX_GENERATABLE_FILE_SIZE)) {
                  onCustomDataContentSizeChange(value);
                }
              }}
              placeholder="Enter content size in bytes"
              disabled={generatingType !== null}
            />
            {customDataContentSize && (isNaN(parseInt(customDataContentSize, 10)) || parseInt(customDataContentSize, 10) <= 0 || parseInt(customDataContentSize, 10) > MAX_GENERATABLE_FILE_SIZE) && (
              <p className="text-sm text-destructive">
                Please enter a number between 1 and {MAX_GENERATABLE_FILE_SIZE.toLocaleString()}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <div className="text-sm font-medium">Well Compressible Data</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={onGenerateWellCompressibleBE}
                disabled={generatingType !== null || !customDataContentSize || isNaN(parseInt(customDataContentSize, 10)) || parseInt(customDataContentSize, 10) <= 0 || parseInt(customDataContentSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                variant="outline"
                className="w-full"
              >
                {generatingType === "wellCompressibleBE" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating... {formatElapsedTimeShort(elapsedMilliseconds)}
                  </>
                ) : (
                  "Well Compressible (BE)"
                )}
              </Button>
              <Button
                onClick={onGenerateWellCompressibleLE}
                disabled={generatingType !== null || !customDataContentSize || isNaN(parseInt(customDataContentSize, 10)) || parseInt(customDataContentSize, 10) <= 0 || parseInt(customDataContentSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                variant="outline"
                className="w-full"
              >
                {generatingType === "wellCompressibleLE" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating... {formatElapsedTimeShort(elapsedMilliseconds)}
                  </>
                ) : (
                  "Well Compressible (LE)"
                )}
              </Button>
            </div>
            <div className="text-sm font-medium mt-4">Compressed Data (.zeck) 
              {validateCustomDataContentSize(false) && <span className="text-xs text-muted-foreground">{" "}(total file size will be {ZECK_FILE_HEADER_SIZE + validateCustomDataContentSize(false)!} bytes)</span>}
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={onGenerateCompressedBE}
                disabled={generatingType !== null || !customDataContentSize || isNaN(parseInt(customDataContentSize, 10)) || parseInt(customDataContentSize, 10) <= 0 || parseInt(customDataContentSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                variant="outline"
                className="w-full"
              >
                {generatingType === "compressedBE" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating... {formatElapsedTimeShort(elapsedMilliseconds)}
                  </>
                ) : (
                  "Compressed (BE)"
                )}
              </Button>
              <Button
                onClick={onGenerateCompressedLE}
                disabled={generatingType !== null || !customDataContentSize || isNaN(parseInt(customDataContentSize, 10)) || parseInt(customDataContentSize, 10) <= 0 || parseInt(customDataContentSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                variant="outline"
                className="w-full"
              >
                {generatingType === "compressedLE" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating... {formatElapsedTimeShort(elapsedMilliseconds)}
                  </>
                ) : (
                  "Compressed (LE)"
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              onCustomDataContentSizeChange("");
            }}
            disabled={generatingType !== null}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

