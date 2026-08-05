type Props = {
  label: string;
  size?: "sm" | "lg";
};

const sizeClasses = { sm: "h-6 w-6", lg: "h-10 w-10" };

export function Spinner({ label, size = "sm" }: Props) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-2 border-brown/30 border-t-brown ${sizeClasses[size]}`}
    />
  );
}
