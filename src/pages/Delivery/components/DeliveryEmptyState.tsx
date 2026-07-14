import { PackageOpen } from "lucide-react";

interface DeliveryEmptyStateProps {
  title: string;
  description: string;
}

export default function DeliveryEmptyState({
  title,
  description,
}: DeliveryEmptyStateProps) {
  return (
    <div className="delivery-empty-state">
      <PackageOpen size={42} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
