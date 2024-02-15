import React, { useState, useEffect } from 'react';
import axios from 'axios'; // For API calls
import Dropzone from 'react-dropzone'; // For file selection
import ProgressBar from '@ramonak/react-progress-bar'; // For progress bar
import { Table, Button } from 'antd'; // For table component
import * as XLSX from 'xlsx'; // For Excel file creation

function App() {
  const [file, setFile] = useState(null);
  const [bookData, setBookData] = useState([]);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  let totalRows = 0;

  const handleFileSelect = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const processExcelData = async () => {
    if (!file) return; // Handle missing file error

    const sheet = await parseExcelFile(file); // Implement Excel parsing

    setBookData([]);
    setProgress(0);
    setErrors([]);

    const range = XLSX.utils.decode_range(sheet['!ref']);
    totalRows = (range.e.r - range.s.r) + 1;

    for (let row = 2; row <= totalRows; row++) { // Start from row 2
      let isbn;
      try {
        isbn = sheet[`A${row}`]?.v; // Check column index
        const price = sheet[`B${row}`]?.v; // Check column index
        const buyingPrice = sheet[`C${row}`]?.v; // Check column index

        const bookResponse = await getBookDataFromAPI(isbn);
        setBookData((prevData) => [...prevData, { ...bookResponse.data, price, buyingPrice }]);
        setProgress((prevProgress) => prevProgress + 1);
      } catch (error) {
        setErrors((prevErrors) => [...prevErrors, `Error processing ISBN ${isbn}: ${error.message}`]);
      }
    }
  };

  const parseExcelFile = async (file) => {
    const reader = new FileReader();
    const readFileAsync = new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        try {
          const arrayBuffer = new Uint8Array(event.target.result);
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
  
          resolve(worksheet);
        } catch (error) {
          reject(error);
        }
      };
  
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  
    try {
      const worksheet = await readFileAsync;
      return worksheet;
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      // Handle error and display appropriate message to user
    }
  };

  const getBookDataFromAPI = async (isbn) => {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=AIzaSyCJMLrc_vJtYBiD6yPFqcDMlmGd2e4pL4w`;
    const response = await axios.get(apiUrl); // Handle errors and retries
    return response.data;
  };

  const handleExportData = () => {
    const worksheet = XLSX.utils.json_to_sheet(bookData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Book Data');
    XLSX.writeFile(workbook, 'book_data.xlsx');
  };

  const columns = [
    { title: 'ISBN', dataIndex: 'id' },
    { title: 'Title', dataIndex: 'volumeInfo.title' },
    { title: 'Publisher', dataIndex: 'volumeInfo.publisher' },
    { title: 'Pages', dataIndex: 'volumeInfo.pageCount' },
    { title: 'Authors', dataIndex: 'volumeInfo.authors' },
    { title: 'Price', dataIndex: 'price' },
    { title: 'Buying Price', dataIndex: 'buyingPrice' },
  ];

  return (
    <div>
      <h2>Book Data Extractor</h2>
      <Dropzone onDrop={handleFileSelect}>
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <p>Drag and drop or click to select an Excel file</p>
          </div>
        )}
      </Dropzone>
      <button onClick={processExcelData}>Process Data</button>
      {progress > 0 && (
        <div>
          <ProgressBar progress={progress / totalRows} />
          {errors.length > 0 && (
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {bookData.length > 0 && (
        <div>
          <Table columns={columns} dataSource={bookData} />
          <Button onClick={handleExportData}>Export Data</Button>
        </div>
      )}
    </div>
  );
}

export default App;
