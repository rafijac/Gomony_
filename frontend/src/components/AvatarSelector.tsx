import { AVATAR_PRESETS } from '../assets/avatars/presets';

interface AvatarSelectorProps {
  value: string;
  onChange: (url: string) => void;
  editingLocked?: boolean;
}

export default function AvatarSelector({ value, onChange, editingLocked = false }: AvatarSelectorProps) {
  return (
    <div className="avatar-selector">
      {AVATAR_PRESETS.map((url, idx) => (
        <img
          key={url}
          src={url}
          alt={`Avatar ${idx + 1}`}
          className={value === url ? 'selected' : ''}
          onClick={() => !editingLocked && onChange(url)}
          aria-disabled={editingLocked ? 'true' : undefined}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            margin: 4,
            border: value === url ? '2px solid #007bff' : '2px solid transparent',
            cursor: editingLocked ? 'not-allowed' : 'pointer',
            opacity: editingLocked ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}
