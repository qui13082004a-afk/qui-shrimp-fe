import type { LucideIcon } from "lucide-react";

interface DeliveryStatCardProps {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone?: "blue" | "yellow" | "green" | "red";
}

export default function DeliveryStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "blue",
}: DeliveryStatCardProps) {
  return (
    <article className={`delivery-stat-card tone-${tone}`}>
      <div className="delivery-stat-card__icon">
        <Icon size={22} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}
