// ...existing code...
import './HelpModal.css';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Help and Instructions">
      <div className="modal help-modal" tabIndex={-1}>
        <div className="modal-header-sticky">
          <h2>How to Play Gomony</h2>
          <button
            className="modal-close-btn"
            aria-label="Close help"
            onClick={onClose}
            tabIndex={0}
            type="button"
          >
            &times;
          </button>
        </div>
        <div className="modal-content-scrollable">
          <section>
            <h3>Objective</h3>
            <p>Capture all opponent pieces or leave them with no legal moves. Stack captured pieces to build powerful stacks!</p>
          </section>
          <section>
            <h3>Basic Rules</h3>
            <ul>
              <li>Only <b>dark squares</b> are playable.</li>
              <li>Move your <b>entire stack</b> one step diagonally to an <b>empty</b> dark square.</li>
              <li>Non-kings move forward only; kings move in all diagonal directions.</li>
              <li>To <b>jump</b>, leap diagonally over an adjacent opponent stack to an empty square two steps away. Only the <b>top piece</b> jumps and captures.</li>
              <li>Captured piece is placed <b>underneath</b> your jumping piece at the destination.</li>
              <li>If a jump is available, you <b>must</b> take it (mandatory jump rule).</li>
              <li>Multi-jumps: keep jumping as long as possible with the same piece.</li>
              <li>Reach the far row to <b>king</b> a piece. Kings can move/jump in all directions.</li>
            </ul>
          </section>
          <section>
            <h3>Controls</h3>
            <ul>
              <li><b>Click</b> or <b>drag</b> a stack to select and move.</li>
              <li>Restart the game anytime with the <b>Restart</b> button.</li>
              <li>Use the <b>Help</b> button (<span aria-label="help icon">❓</span>) for these instructions.</li>
            </ul>
          </section>
          <section>
            <h3>Tips</h3>
            <ul>
              <li>Stacking captured pieces makes your stack stronger.</li>
              <li>Protect your kings—they can move and jump in any direction!</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
