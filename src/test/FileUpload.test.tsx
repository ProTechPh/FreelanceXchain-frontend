import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '../components/ui/FileUpload';

describe('FileUpload Component', () => {
  const mockOnFilesChange = vi.fn();

  beforeEach(() => {
    mockOnFilesChange.mockClear();
  });

  it('renders with default props', () => {
    render(
      <FileUpload
        files={[]}
        onFilesChange={mockOnFilesChange}
      />
    );

    expect(screen.getByText(/drag & drop files here/i)).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(
      <FileUpload
        files={[]}
        onFilesChange={mockOnFilesChange}
        label="Upload Documents"
      />
    );

    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <FileUpload
        files={[]}
        onFilesChange={mockOnFilesChange}
        error="File too large"
      />
    );

    expect(screen.getByText('File too large')).toBeInTheDocument();
  });

  it('displays uploaded files', () => {
    const mockFiles = [
      new File(['content'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content'], 'test2.png', { type: 'image/png' }),
    ];

    render(
      <FileUpload
        files={mockFiles}
        onFilesChange={mockOnFilesChange}
      />
    );

    expect(screen.getByText('test1.pdf')).toBeInTheDocument();
    expect(screen.getByText('test2.png')).toBeInTheDocument();
  });

  it('shows file count and size', () => {
    const mockFiles = [
      new File(['a'.repeat(1024)], 'test.pdf', { type: 'application/pdf' }),
    ];

    render(
      <FileUpload
        files={mockFiles}
        onFilesChange={mockOnFilesChange}
        maxFiles={5}
        maxSizeMB={25}
      />
    );

    expect(screen.getByText(/1\/5 files/i)).toBeInTheDocument();
  });

  it('disables interaction when disabled prop is true', () => {
    render(
      <FileUpload
        files={[]}
        onFilesChange={mockOnFilesChange}
        disabled={true}
      />
    );

    const input = screen.getByRole('textbox', { hidden: true }) || 
                  document.querySelector('input[type="file"]');
    expect(input).toBeDisabled();
  });

  it('validates file count limit', async () => {
    render(
      <FileUpload
        files={[]}
        onFilesChange={mockOnFilesChange}
        maxFiles={2}
      />
    );

    // Simulate adding 3 files (exceeds limit of 2)
    const mockFiles = [
      new File(['content'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content'], 'test2.pdf', { type: 'application/pdf' }),
      new File(['content'], 'test3.pdf', { type: 'application/pdf' }),
    ];

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create a mock FileList
    Object.defineProperty(input, 'files', {
      value: mockFiles,
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/maximum.*2.*files/i)).toBeInTheDocument();
    });
  });

  it('validates file types', async () => {
    render(
      <FileUpload
        files={[]}
        onFilesChange={mockOnFilesChange}
        acceptedTypes={['.pdf', '.png']}
      />
    );

    const mockFiles = [
      new File(['content'], 'test.exe', { type: 'application/x-msdownload' }),
    ];

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: mockFiles,
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    });
  });

  it('removes file when remove button is clicked', () => {
    const mockFiles = [
      new File(['content'], 'test.pdf', { type: 'application/pdf' }),
    ];

    render(
      <FileUpload
        files={mockFiles}
        onFilesChange={mockOnFilesChange}
      />
    );

    const removeButton = screen.getByLabelText('Remove file');
    fireEvent.click(removeButton);

    expect(mockOnFilesChange).toHaveBeenCalledWith([]);
  });

  it('handles drag and drop', () => {
    render(
      <FileUpload
        files={[]}
        onFilesChange={mockOnFilesChange}
      />
    );

    const dropZone = screen.getByText(/drag & drop files here/i).closest('div');
    
    // Simulate drag over
    fireEvent.dragOver(dropZone!);
    
    // Simulate drag leave
    fireEvent.dragLeave(dropZone!);
    
    // Simulate drop
    const mockFiles = [
      new File(['content'], 'test.pdf', { type: 'application/pdf' }),
    ];
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: mockFiles,
      },
    });
    
    fireEvent(dropZone!, dropEvent);
  });
});
