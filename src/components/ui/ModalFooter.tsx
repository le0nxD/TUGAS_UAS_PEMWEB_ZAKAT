import React from 'react';
import Button from './Button';

interface ModalFooterProps {
  onClose: () => void;
  onSubmit?: () => void;
  isEdit?: boolean;
  isView?: boolean;
  onEdit?: () => void;
  isDelete?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  onClose,
  onSubmit,
  isEdit,
  isView,
  onEdit,
  isDelete,
  submitLabel = 'Simpan',
  cancelLabel = 'Batal',
}) => {
  if (isView) {
    return (
      <div className="flex justify-end space-x-2 mt-6">
        <Button variant="outline" onClick={onClose}>
          Tutup
        </Button>
        {onEdit && (
          <Button variant="primary" onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
    );
  }

  if (isDelete) {
    return (
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onSubmit}>
          Hapus
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end space-x-2 mt-6">
      <Button variant="outline" type="button" onClick={onClose}>
        {cancelLabel}
      </Button>
      <Button variant="primary" type="submit">
        {isEdit ? 'Perbarui' : submitLabel}
      </Button>
    </div>
  );
};

export default ModalFooter;