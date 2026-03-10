import React from 'react';

const Modal = ({ isOpen, modalType, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) => {
  return (
    <div className={`modal-overlay ${isOpen ? 'modal-open' : ''}`} data-testid="modal-overlay">
      <div
        className="modal"
        data-modal={modalType}
        data-testid="modal-dialog"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title" data-testid="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p className="modal-message" data-testid="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-danger" data-testid="modal-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn-secondary" data-testid="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
