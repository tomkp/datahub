import { Badge } from './ui/Badge';
import { type VariantProps } from 'class-variance-authority';
import { badgeVariants } from './ui/variants';

type FileType = 'CSV' | 'TSV' | 'Excel' | 'Text' | 'JSON' | 'XML' | 'PDF';

const FILE_TYPE_MAP: Record<string, FileType> = {
  csv: 'CSV',
  tsv: 'TSV',
  xlsx: 'Excel',
  xls: 'Excel',
  xlsm: 'Excel',
  xlsb: 'Excel',
  txt: 'Text',
  json: 'JSON',
  xml: 'XML',
  pdf: 'PDF',
};

const FILE_TYPE_VARIANTS: Record<FileType, VariantProps<typeof badgeVariants>['variant']> = {
  CSV: 'primary',
  TSV: 'primary',
  Excel: 'success',
  Text: 'default',
  JSON: 'warning',
  XML: 'warning',
  PDF: 'error',
};

export function getFileType(filename: string): FileType | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return FILE_TYPE_MAP[ext] || null;
}

interface FileTypeBadgeProps {
  filename: string;
  className?: string;
}

export function FileTypeBadge({ filename, className }: FileTypeBadgeProps) {
  const fileType = getFileType(filename);

  if (!fileType) return null;

  return (
    <Badge variant={FILE_TYPE_VARIANTS[fileType]} size="sm" className={className}>
      {fileType}
    </Badge>
  );
}
