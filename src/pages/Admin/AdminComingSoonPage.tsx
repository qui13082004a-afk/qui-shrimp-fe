type AdminComingSoonPageProps = {
  title: string;
};

export default function AdminComingSoonPage({
  title,
}: AdminComingSoonPageProps) {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <p className="admin-page__eyebrow">Đang phát triển</p>
        <h1>{title}</h1>
        <p>
          Chức năng này sẽ được triển khai sau. Hiện tại hệ thống đã gắn sẵn
          route để không bị lỗi khi bấm menu.
        </p>
      </div>
    </div>
  );
}