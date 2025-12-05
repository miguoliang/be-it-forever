import { useRouter } from "next/navigation";

interface NextButtonProps {
  onClick?: () => void;
  disabled: boolean;
  label?: string;
}

export function NextButton({ onClick, disabled, label = "下一步" }: NextButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    router.push("/operator/import/preview");
  };

  return (
    <div className="text-center">
      <button
        onClick={handleClick}
        disabled={disabled}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {label}
      </button>
    </div>
  );
}

