import { useLanguage } from '../context/LanguageContext';

export default function StatusBadge({ status }) {
  const { t } = useLanguage();
  const currentStatus = status || 'draft';
  const label = t(`status.${currentStatus}`, currentStatus.toUpperCase());

  return (
    <span className={`badge badge-${currentStatus}`}>
      {label}
    </span>
  );
}

