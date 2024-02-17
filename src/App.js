import React, { useState, useEffect } from 'react';
import axios from 'axios'; // For API calls
import { useDropzone } from 'react-dropzone'; // For file selection
import * as XLSX from 'xlsx'; // For Excel file creation
import DataTable from "./components/DataTable.js";

/*React Bootstrap components*/
import { Progress, Alert, ListGroup, ListGroupItem, Card, CardBody, CardTitle, CardText } from 'reactstrap';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import logo from './reshot-icon-book.svg';

function App() {
  const [file, setFile] = useState(null);
  const [bookData, setBookData] = useState([]);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  const [isDropzoneDisabled, setIsDropzoneDisabled] = useState(false);
  const [isProcessButtonDisabled, setIsProcessButtonDisabled] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const onDismiss = () => setAlertVisible(false);

  let totalRows = 0;

  const handleFileSelect = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
    // Hide alert if visible
    setAlertVisible(false);
  };

  const processExcelData = async () => {
    if (!file) {
      setAlertVisible(true);
      return; // Handle missing file error
    }

    console.log('alert: ', alertVisible);

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



  function ExcelInput(props) {
    const {
      getRootProps,
      getInputProps
    } = useDropzone({
      accept: {
        'application/vnd.ms-excel': [],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      },
      multiple: false,
      onDrop: handleFileSelect,
      disabled: isDropzoneDisabled
    });

    const uploadedFiles = file ? `${file.name} - ${Math.round(file.size / 1024)} KB` : '';

    return (
      <section className="dropzone-container">
        <div {...getRootProps({ className: 'dropzone' })} className='dropzone'>
          <input {...getInputProps()} />
          <p>Drag 'n' drop an Excel file here</p>
          <em>(Only *.xls or *.xlsx files will be accepted)</em>
        </div>
        {(file) && (
          <aside className='text-start'>
            <h5 className='mt-2'>Uploaded file</h5>
            <hr className="border border-success border-2 opacity-50"></hr>
            {uploadedFiles}
          </aside>
        )}
      </section>
    );
  }

  useEffect(() => {
    document.body.classList.add(
      'd-flex',
      'h-100',
      'text-center',
      'text-bg-dark',
    );
  }, []);

  return (
    <main className='px-3'>
      <div>
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Book Data Extractor</h1>
      </div>
      <ExcelInput />
      <div className='m-3'>
        <button onClick={isProcessButtonDisabled ? null : processExcelData} disabled={isProcessButtonDisabled} className='btn btn-lg btn-light fw-bold border-white bg-white'>Process Data</button>
      </div>
      <Alert color="warning" className='d-flex align-items-center' isOpen={alertVisible} toggle={onDismiss}>
        <svg xmlns="http://www.w3.org/2000/svg" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        </svg>
        <div>
          Why so hungry? Please select a file first.
        </div>

      </Alert>
      {progress > 0 && (
        <div>
          <Progress
            className="my-3"
            color="success"
            striped
            value={progress}
          />
          {errors.length > 0 && (
            <Card color="dark" className='mb-3'>
              <CardBody>
                <CardTitle tag="h3" className='text-danger'>
                  Error List
                </CardTitle>
                <ListGroup
                  flush
                  numbered
                  className='mb-3 text-start'
                >
                  {errors.map((error) => (
                    <ListGroupItem key={error}>{error}</ListGroupItem>
                  ))}
                </ListGroup>

              </CardBody>
            </Card>
          )}
        </div>
      )}
      {bookData.length > 0 && (
        <DataTable dataSource={bookData} handleData={handleExportData} />
      )}
    </main>
  );
}

export default App;