import React from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["modal-header"]}>
          <h3>{title}</h3>
          <button className={styles["modal-close-btn"]} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles["modal-body"]}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
