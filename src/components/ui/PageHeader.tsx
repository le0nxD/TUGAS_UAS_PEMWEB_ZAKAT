import React from 'react';
import Button from './Button';
import { Plus, FileDown } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  onAdd: () => void;
  onExport: () => void;
  addButtonText: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onAdd,
  onExport,
  addButtonText,
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <div className="flex gap-2">
        <Button
          variant="outline"
          icon={<FileDown size={16} />}
          onClick={onExport}
        >
          Ekspor PDF
        </Button>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={onAdd}
        >
          {addButtonText}
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;