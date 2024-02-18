import React, { useState, useEffect } from 'react';
import axios from 'axios'; // For API calls
import { useDropzone } from 'react-dropzone'; // For file selection
import * as XLSX from 'xlsx'; // For Excel file creation
import DataTable from "./components/DataTable.js";

/*React Bootstrap components*/
import { Progress, Alert, ListGroup, ListGroupItem, Card, CardBody, CardTitle } from 'reactstrap';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import logo from './reshot-icon-book.svg';

function App() {
  const [file, setFile] = useState(null);
  const [bookData, setBookData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isDropzoneDisabled, setIsDropzoneDisabled] = useState(false);
  const [isProcessButtonDisabled, setIsProcessButtonDisabled] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const onDismiss = () => setAlertVisible(false);

  const [progress, setProgress] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentRowNumber, setCurrentRowNumber] = useState(0);
  const [currentIsbn, setCurrentIsbn] = useState('');

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

    // Disable Dropzone and button after processing starts
    setIsDropzoneDisabled(true);
    setIsProcessButtonDisabled(true);

    const sheet = await parseExcelFile(file); // Implement Excel parsing

    setBookData([]);
    setProgress(0);
    setTotalRecords(0);
    setCurrentRowNumber(0);
    setErrors([]);

    const range = XLSX.utils.decode_range(sheet['!ref']);
    let totalRows = (range.e.r - range.s.r) + 1;
    setTotalRecords(totalRows - 1);

    for (let row = 2; row <= totalRows; row++) { // Start from row 2
      let isbn = '';
      try {
        isbn = sheet[`A${row}`]?.v;
        setCurrentIsbn(isbn);
        const purchasePrice = removeTextAndConvertToNumber(sheet[`B${row}`]?.v);
        const sellingPrice = removeTextAndConvertToNumber(sheet[`C${row}`]?.v);
        const stock = removeTextAndConvertToNumber(sheet[`D${row}`]?.v);

        const bookResponse = await getBookDataFromGoogleAPI(isbn);
        
        let id, title, authors, publisher, isbn10, isbn13, pages, publishedDate, description, categories, maturityRating, image, source;
        if (bookResponse.totalItems > 0) {
          id = bookResponse.items[0]?.id;
          const volumeInfo = bookResponse.items[0]?.volumeInfo;
          title = getBookTitle(volumeInfo?.title, volumeInfo?.subtitle);
          authors = arrayToString(volumeInfo?.authors);
          publisher = volumeInfo?.publisher;
          isbn10 = volumeInfo?.industryIdentifiers.find(
            (identifier) => identifier.type === "ISBN_10"
          )?.identifier;
          isbn13 = volumeInfo?.industryIdentifiers.find(
            (identifier) => identifier.type === "ISBN_13"
          )?.identifier;
          pages = volumeInfo?.pageCount;
          publishedDate = volumeInfo?.publishedDate;
          description = volumeInfo?.description;
          categories = arrayToString(volumeInfo?.categories);
          maturityRating = volumeInfo?.maturityRating;
          const { medium, large, extraLarge } = volumeInfo?.imageLinks;
          image = extraLarge || large || medium;
          source = 'Google Books';
        } 
        else {          
          const bookResponseFromOL = await getBookDataFromOpenLibraryAPI(isbn);          
          
          const  bookItem  = bookResponseFromOL.docs[0];
          id = bookItem?.key;
          title = getBookTitle(bookItem?.title, bookItem?.subtitle);
          authors = arrayToString(bookItem?.author_name);
          publisher = bookItem?.publisher? bookItem?.publisher[bookItem?.publisher.length - 1]:'';
          isbn10 = isbn.toString().length === 13
            ? isbn.toString().slice(-10)
            : null; // Set isbn10 to null if not 13 digits
          isbn13 = isbn.toString().length === 13
            ? isbn
            : null; // Set isbn13 to null if not 13 digits
          pages = bookItem?.number_of_pages_median;
          publishedDate = bookItem?.publish_date? bookItem?.publish_date[bookItem?.publish_date.length - 1]:'';
          categories = arrayToString(bookItem?.subject);
          image = bookItem?.cover_edition_key;
          source = 'Open Library';

          console.info('Book data:', { title, authors, publisher, isbn10, isbn13, pages, publishedDate, description, categories, maturityRating, image, source, sellingPrice, purchasePrice, stock });
        }

        setBookData((prevData) => [...prevData, { title, authors, publisher, isbn10, isbn13, pages, publishedDate, description, categories, maturityRating, image, source, sellingPrice, purchasePrice, stock, key: id }]);

        setCurrentRowNumber(row - 1);
        setProgress(Math.round((row / totalRows) * 100));
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

  const getBookDataFromGoogleAPI = async (isbn) => {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const response = await axios.get(apiUrl); // TODO: Handle errors and retries

    return response.data;
  };

  const getBookDataFromOpenLibraryAPI = async (isbn) => {
    const apiUrl = `https://openlibrary.org/search.json?q=${isbn}&fields=*&limit=1`;
    const response = await axios.get(apiUrl); // TODO: Handle errors and retries

    return response.data;
  };

  const handleExportData = () => {
    const worksheet = XLSX.utils.json_to_sheet(bookData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Book Data');
    XLSX.writeFile(workbook, 'book_data.xlsx');
  };

  function removeTextAndConvertToNumber(text) {
    // Remove all characters except numbers, ".", "+" or "-".
    const numberString = text.replace(/[^0-9\-+\.]/g, "");

    // If the string is empty or contains only non-numeric characters, return null.
    if (!numberString) {
      return null;
    }

    // Try to convert the string to a number.
    return parseFloat(numberString);
  }

  function arrayToString(array) {
    return array? array.join(', '):'';
  }

    /**
   * Retrieve the book title with optional subtitle.
   *
   * @param {string} title - the main title of the book
   * @param {string} subtitle - the optional subtitle of the book
   * @return {string} the complete book title including the subtitle if available
   */
  function getBookTitle(titleNode, subtitleNode) {
    const title = titleNode || '';
          const subtitle = subtitleNode || '';          
    return subtitle ? `${title} - ${subtitle}` : title;
  }

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
    <div className='container d-flex w-100 h-100 p-3 mx-auto flex-column'>
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
            <div className='clearfix'>
              <div className='float-md-start mb-0'>Progress: <strong> {currentRowNumber} / {totalRecords}</strong></div>
              <div className='float-md-end'>Now processing: <strong>{currentIsbn}</strong></div>
            </div>

            <Progress
              className="my-3"
              color="success"
              striped
              animated
              value={progress}
              style={{
                height: '2.2em'
              }}
            >
              {progress}%
            </Progress>
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
      <footer className="mt-auto text-white-50">
        <p>Book Info Extractor by Ratul Paul using <a href="https://reactjs.org" target="_blank" className="text-white" rel='noreferrer'>React</a>.</p>
      </footer>
    </div>
  );
}

export default App;