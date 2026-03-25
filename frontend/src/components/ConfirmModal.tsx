
import './ConfirmModal.css';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop confirm-modal-backdrop">
      <div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="modal-btn confirm" onClick={onConfirm}>{confirmLabel}</button>
          <button className="modal-btn cancel" onClick={onCancel}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}
