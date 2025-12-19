import { motion } from "framer-motion";
import { Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompressButtonProps {
  disabled: boolean;
  isCompressing: boolean;
  onClick: () => void;
}

export const CompressButton = ({ disabled, isCompressing, onClick }: CompressButtonProps) => {
  return (
    <motion.div
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      <Button
        onClick={onClick}
        disabled={disabled}
        size="lg"
        className="w-full h-14 text-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCompressing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Compressing...
          </>
        ) : (
          <>
            <Archive className="w-5 h-5 mr-2" />
            Compress Files
          </>
        )}
      </Button>
    </motion.div>
  );
};
