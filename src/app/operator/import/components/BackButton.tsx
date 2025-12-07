import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
}

export const BackButton = ({ onClick, label = "返回" }: BackButtonProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push("/operator/import");
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="default"
    >
      {label}
    </Button>
  );
};

