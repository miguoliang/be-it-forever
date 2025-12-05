interface ImportButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

export function ImportButton({ onClick, loading, disabled }: ImportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "导入中..." : "开始导入"}
    </button>
  );
}

