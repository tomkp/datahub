import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileTypeBadge, getFileType } from './FileTypeBadge';

describe('getFileType', () => {
  it('returns CSV for .csv files', () => {
    expect(getFileType('data.csv')).toBe('CSV');
  });

  it('returns TSV for .tsv files', () => {
    expect(getFileType('data.tsv')).toBe('TSV');
  });

  it('returns Excel for .xlsx files', () => {
    expect(getFileType('data.xlsx')).toBe('Excel');
  });

  it('returns Excel for .xls files', () => {
    expect(getFileType('data.xls')).toBe('Excel');
  });

  it('returns Excel for .xlsm files', () => {
    expect(getFileType('data.xlsm')).toBe('Excel');
  });

  it('returns Excel for .xlsb files', () => {
    expect(getFileType('data.xlsb')).toBe('Excel');
  });

  it('returns Text for .txt files', () => {
    expect(getFileType('readme.txt')).toBe('Text');
  });

  it('returns JSON for .json files', () => {
    expect(getFileType('config.json')).toBe('JSON');
  });

  it('returns XML for .xml files', () => {
    expect(getFileType('data.xml')).toBe('XML');
  });

  it('returns PDF for .pdf files', () => {
    expect(getFileType('document.pdf')).toBe('PDF');
  });

  it('returns null for unknown extensions', () => {
    expect(getFileType('file.unknown')).toBeNull();
  });

  it('handles files without extension', () => {
    expect(getFileType('README')).toBeNull();
  });

  it('is case insensitive', () => {
    expect(getFileType('DATA.CSV')).toBe('CSV');
    expect(getFileType('file.XLSX')).toBe('Excel');
  });
});

describe('FileTypeBadge', () => {
  it('renders badge for CSV file', () => {
    render(<FileTypeBadge filename="data.csv" />);
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });

  it('renders badge for Excel file', () => {
    render(<FileTypeBadge filename="report.xlsx" />);
    expect(screen.getByText('Excel')).toBeInTheDocument();
  });

  it('renders badge for TSV file', () => {
    render(<FileTypeBadge filename="data.tsv" />);
    expect(screen.getByText('TSV')).toBeInTheDocument();
  });

  it('renders nothing for unknown file type', () => {
    const { container } = render(<FileTypeBadge filename="file.unknown" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('applies primary variant for CSV', () => {
    render(<FileTypeBadge filename="data.csv" />);
    expect(screen.getByText('CSV')).toHaveClass('bg-primary/10');
  });

  it('applies success variant for Excel', () => {
    render(<FileTypeBadge filename="data.xlsx" />);
    expect(screen.getByText('Excel')).toHaveClass('bg-green-500/10');
  });
});
