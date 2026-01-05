import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MEDIUM_ARTICLE_URL } from "@/lib/constants";

interface FooterSectionProps {
  onOpenCustomDataDialog: () => void;
}

export const FooterSection = ({ onOpenCustomDataDialog }: FooterSectionProps): JSX.Element => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="text-center mt-12 text-sm text-muted-foreground space-y-3"
      aria-label="Footer information"
    >
      <div className="mt-6 text-center">
        <Button
          onClick={onOpenCustomDataDialog}
          variant="secondary"
          className="w-full sm:w-auto mx-auto"
        >
          Generate Custom Sized Data
        </Button>
      </div>
      <p>
        All processing happens locally in your browser.{" "}
        <span className="text-primary">Your files never leave your device.</span>
      </p>
      <p>
        Works offline —{" "}
        <a 
          href="https://github.com/pRizz/zeckendorf-webapp" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          free &amp; open source
        </a>{" "}
        on GitHub (MIT License)
      </p>
      <p>
        <a 
          href="https://github.com/pRizz/zeckendorf" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Free &amp; open source Rust code
        </a>{" "}
        for Zeckendorf Compression and Decompression
      </p>
      <p>
        <a 
          href={MEDIUM_ARTICLE_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Learn about Zeckendorf compression
        </a>
      </p>
      <p className="text-xs">
        Made by{" "}
        <span className="text-foreground">Peter Ryszkiewicz</span>{" "}
        with{" "}
        <a 
          href="https://cursor.sh" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Cursor
        </a>
        {" "}and{" "}
        <a 
          href="https://lovable.dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Lovable
        </a>
      </p>
    </motion.footer>
  );
};

