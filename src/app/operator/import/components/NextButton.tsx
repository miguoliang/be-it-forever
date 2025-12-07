import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface NextButtonProps {
  onClick?: () => void;
  disabled: boolean;
  label?: string;
}

export const NextButton = ({ onClick, disabled, label = "下一步" }: NextButtonProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    router.push("/operator/import/preview");
  };

  return (
    <div className="text-center">
      <Button
        onClick={handleClick}
        disabled={disabled}
        size="lg"
        className="px-6 py-3"
      >
        {label}
      </Button>
    </div>
  );
};

