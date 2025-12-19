import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2 } from "lucide-react";

export type CompressionFormat = "zip" | "gzip" | "deflate";
export type CompressionLevel = "fast" | "balanced" | "maximum";

interface CompressionOptionsProps {
  format: CompressionFormat;
  level: CompressionLevel;
  onFormatChange: (format: CompressionFormat) => void;
  onLevelChange: (level: CompressionLevel) => void;
}

const formats: { value: CompressionFormat; label: string; description: string }[] = [
  { value: "zip", label: "ZIP", description: "Universal compatibility" },
  { value: "gzip", label: "GZIP", description: "Single file compression" },
  { value: "deflate", label: "DEFLATE", description: "Raw compression" },
];

const levels: { value: CompressionLevel; label: string; description: string }[] = [
  { value: "fast", label: "Fast", description: "Quick compression" },
  { value: "balanced", label: "Balanced", description: "Speed & size" },
  { value: "maximum", label: "Maximum", description: "Smallest size" },
];

export const CompressionOptions = ({
  format,
  level,
  onFormatChange,
  onLevelChange,
}: CompressionOptionsProps) => {
  return (
    <div className="p-5 rounded-xl glass border border-border space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <Settings2 className="w-4 h-4" />
        <span>Compression Settings</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Format</label>
          <Select value={format} onValueChange={(v) => onFormatChange(v as CompressionFormat)}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {formats.map((f) => (
                <SelectItem key={f.value} value={f.value} className="cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-medium">{f.label}</span>
                    <span className="text-xs text-muted-foreground">{f.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Compression Level</label>
          <Select value={level} onValueChange={(v) => onLevelChange(v as CompressionLevel)}>
            <SelectTrigger className="w-full bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {levels.map((l) => (
                <SelectItem key={l.value} value={l.value} className="cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-medium">{l.label}</span>
                    <span className="text-xs text-muted-foreground">{l.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
