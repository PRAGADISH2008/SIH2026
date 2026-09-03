export default function StatusBadge({ status }) {
  const labels = { draft: 'Draft', confirmed: 'Confirmed', published: 'Published' };
  return (
    <span className={`badge badge-${status || 'draft'}`}>
      {labels[status] || status || 'Draft'}
    </span>
  );
}
