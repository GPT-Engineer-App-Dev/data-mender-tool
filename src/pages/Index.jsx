import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Index = () => {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [newRow, setNewRow] = useState({});
  const queryClient = useQueryClient();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
    },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const rows = content.split('\n');
        const headers = rows[0].split(',');
        setHeaders(headers);
        const data = rows.slice(1).map(row => {
          const values = row.split(',');
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {});
        });
        setCsvData(data);
        queryClient.setQueryData(['csvData'], data);
      };
      reader.readAsText(file);
    },
  });

  const { data } = useQuery({
    queryKey: ['csvData'],
    queryFn: () => csvData,
    enabled: csvData.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: (updatedRow) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const updatedData = csvData.map(row => 
            row.id === updatedRow.id ? updatedRow : row
          );
          setCsvData(updatedData);
          resolve(updatedData);
        }, 100);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['csvData']);
      toast.success('Row updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const updatedData = csvData.filter(row => row.id !== id);
          setCsvData(updatedData);
          resolve(updatedData);
        }, 100);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['csvData']);
      toast.success('Row deleted successfully');
    },
  });

  const addRowMutation = useMutation({
    mutationFn: (row) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const updatedData = [...csvData, { ...row, id: Date.now().toString() }];
          setCsvData(updatedData);
          resolve(updatedData);
        }, 100);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['csvData']);
      setNewRow({});
      toast.success('Row added successfully');
    },
  });

  const handleEdit = (id, field, value) => {
    const rowToUpdate = csvData.find(row => row.id === id);
    updateMutation.mutate({ ...rowToUpdate, [field]: value });
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleAddRow = () => {
    addRowMutation.mutate(newRow);
  };

  const handleDownload = () => {
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'updated_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CSV Editor</h1>
      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-4 mb-4 cursor-pointer">
        <input {...getInputProps()} />
        <p>Drag 'n' drop a CSV file here, or click to select one</p>
      </div>
      {data && data.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map(header => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={row.id || index}>
                  {headers.map(header => (
                    <TableCell key={header}>
                      <Input
                        value={row[header] || ''}
                        onChange={(e) => handleEdit(row.id, header, e.target.value)}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button variant="destructive" onClick={() => handleDelete(row.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">Add New Row</h2>
            {headers.map(header => (
              <Input
                key={header}
                placeholder={header}
                value={newRow[header] || ''}
                onChange={(e) => setNewRow({ ...newRow, [header]: e.target.value })}
                className="mb-2"
              />
            ))}
            <Button onClick={handleAddRow} className="mr-2">Add Row</Button>
            <Button onClick={handleDownload}>Download CSV</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
