import Papa from 'papaparse';

/**
 * Parses a CSV file content string.
 * @param csvString The content of the uploaded CSV file.
 * @returns Promise resolving to parsed data records.
 */
export const parseCSV = <T>(csvString: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};

/**
 * Generates and downloads a CSV file from a list of objects.
 * @param data Array of objects to export.
 * @param filename The name of the downloaded file.
 */
export const exportToCSV = <T>(data: T[], filename: string): void => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
