import { Button } from "@/components/ui/button";

interface ImportButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

export const ImportButton = ({ onClick, loading, disabled }: ImportButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      size="lg"
      className="px-6 py-3"
    >
      {loading ? "导入中..." : "开始导入"}
    </Button>
  );
};

