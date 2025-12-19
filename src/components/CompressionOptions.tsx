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
  onFormatChange: (format: CompressionFormat) => void;
}

const formats: { value: CompressionFormat; label: string; description: string }[] = [
  { value: "zip", label: "ZIP", description: "Universal compatibility" },
  { value: "gzip", label: "GZIP", description: "Single file compression" },
  { value: "deflate", label: "DEFLATE", description: "Raw compression" },
];

export const CompressionOptions = ({
  format,
  onFormatChange,
}: CompressionOptionsProps) => {
  return (
    <div className="p-5 rounded-xl glass border border-border">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <Settings2 className="w-4 h-4" />
        <span>Compression Format</span>
      </div>

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
  );
};
