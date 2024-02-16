import React, { useState, useEffect } from 'react';
import axios from 'axios'; // For API calls
import {useDropzone} from 'react-dropzone'; // For file selection
import ProgressBar from '@ramonak/react-progress-bar'; // For progress bar
import { Table, Button } from 'antd'; // For table component
import * as XLSX from 'xlsx'; // For Excel file creation

function App() {
  const [file, setFile] = useState(null);
  const [bookData, setBookData] = useState([]);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  const [isDropzoneDisabled, setIsDropzoneDisabled] = useState(false);
  const [isProcessButtonDisabled, setIsProcessButtonDisabled] = useState(false);

  let totalRows = 0;
  // let progress = 0;

  const handleFileSelect = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const processExcelData = async () => {
    if (!file) return; // Handle missing file error

    // Disable Dropzone and button after processing starts
    setIsDropzoneDisabled(true);
    setIsProcessButtonDisabled(true);

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
        const id = bookResponse.items[0]?.id;
        const title = bookResponse.items[0]?.volumeInfo?.title;
        const author = bookResponse.items[0]?.volumeInfo?.authors[0];
        const publisher = bookResponse.items[0]?.volumeInfo?.publisher;
        const isbn10 = bookResponse.items[0]?.volumeInfo?.industryIdentifiers[0]?.identifier;
        const pages = bookResponse.items[0]?.volumeInfo?.pageCount;

        setBookData((prevData) => [...prevData, { isbn10, title, author, publisher, pages, price, buyingPrice, key: id }]);
    
        setProgress((row / totalRows) * 100);
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
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`;
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
    { title: 'ISBN', dataIndex: 'isbn10' },
    { title: 'Title', dataIndex: 'title' },
    { title: 'Publisher', dataIndex: 'publisher' },
    { title: 'Pages', dataIndex: 'pages' },
    { title: 'Authors', dataIndex: 'author' },
    { title: 'Price', dataIndex: 'price' },
    { title: 'Buying Price', dataIndex: 'buyingPrice' },
  ];

  function ExcelInput(props) {
    const {
      getRootProps,
      getInputProps
    } = useDropzone({
      accept: {
        'application/vnd.ms-excel':[],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':[],
      },
      multiple: false,
      onDrop: handleFileSelect,
      disabled: isDropzoneDisabled
    });
  
    const uploadedFiles =  file ? `${file.name} - ${Math.round(file.size / 1024)} KB` : '';
  
    return (
      <section className="container">
        <div {...getRootProps({ className: 'dropzone' })}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop an Excel file here</p>
          <em>(Only *.xls or *.xlsx files will be accepted)</em>
        </div>
        <aside>
          <h4>Accepted file</h4>
          {uploadedFiles}
        </aside>
      </section>
    );
  }

  return (
    <div>
      <h2>Book Data Extractor</h2>
      <ExcelInput/>
      <button onClick={isProcessButtonDisabled?null: processExcelData} disabled={isProcessButtonDisabled}>Process Data</button>
      {console.log('Progress inside: ', progress)}
      {progress > 0 && (
        <div>
          <ProgressBar completed={progress} />
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
