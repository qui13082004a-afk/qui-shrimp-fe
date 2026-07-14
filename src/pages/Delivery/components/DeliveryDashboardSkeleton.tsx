export default function DeliveryDashboardSkeleton() {
  return (
    <div className="delivery-skeleton-list">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="delivery-skeleton-card" key={index}>
          <span />
          <strong />
          <p />
          <small />
        </div>
      ))}
    </div>
  );
}
