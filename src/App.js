import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone'; // For file selection
import * as XLSX from 'xlsx'; // For Excel file creation
import DataTable from "./components/DataTable.js";

/*React Bootstrap components*/
import { Progress, Alert, ListGroup, ListGroupItem, Card, CardBody, CardTitle } from 'reactstrap';

import * as Util from './Utilities/Utility.js';
import * as API from './Utilities/ApiHandler.js';

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
        const sellingPrice = Util.removeTextAndConvertToNumber(sheet[`B${row}`]?.v);
        const purchasePrice = Util.removeTextAndConvertToNumber(sheet[`C${row}`]?.v);
        const quantity = Util.removeTextAndConvertToNumber(sheet[`D${row}`]?.v);

        const bookResponse = await API.getBookDataFromGoogleAPI(isbn);

        let id, name, authors, publisher, isbn10, isbn13, pages, publishedDate, summary, tags, maturityRating, image, source, bookFound = false;
        if (bookResponse.totalItems > 0) {
          id = bookResponse.items[0]?.id;
          const volumeInfo = bookResponse.items[0]?.volumeInfo;
          name = Util.getBookTitle(volumeInfo?.title, volumeInfo?.subtitle);
          authors = Util.arrayToString(volumeInfo?.authors);
          publisher = volumeInfo?.publisher;
          isbn10 = volumeInfo?.industryIdentifiers.find(
            (identifier) => identifier.type === "ISBN_10"
          )?.identifier;
          isbn13 = volumeInfo?.industryIdentifiers.find(
            (identifier) => identifier.type === "ISBN_13"
          )?.identifier;
          pages = volumeInfo?.pageCount;
          publishedDate = volumeInfo?.publishedDate;
          summary = volumeInfo?.description;
          tags = Util.arrayToString(volumeInfo?.categories);
          maturityRating = volumeInfo?.maturityRating;
          const { medium, large, extraLarge } = volumeInfo?.imageLinks;
          image = extraLarge || large || medium;
          source = 'Google Books';
          bookFound = true;
        }
        else {
          const bookResponseFromOL = await API.getBookDataFromOpenLibraryAPI(isbn);
          if (bookResponseFromOL.numFound > 0) {
            const bookItem = bookResponseFromOL.docs[0];
            id = bookItem?.key;
            name = Util.getBookTitle(bookItem?.title, bookItem?.subtitle);
            authors = Util.arrayToString(bookItem?.author_name);
            publisher = bookItem?.publisher ? bookItem?.publisher[bookItem?.publisher.length - 1] : '';
            isbn10 = isbn.toString().length === 13
              ? isbn.toString().slice(-10)
              : null; // Set isbn10 to null if not 13 digits
            isbn13 = isbn.toString().length === 13
              ? isbn
              : null; // Set isbn13 to null if not 13 digits
            pages = bookItem?.number_of_pages_median;
            publishedDate = bookItem?.publish_date ? bookItem?.publish_date[bookItem?.publish_date.length - 1] : '';
            tags = Util.arrayToString(bookItem?.subject);
            image = bookItem?.cover_edition_key;
            source = 'Open Library';
            bookFound = true;
          } else {
            setErrors((prevErrors) => [...prevErrors, Util.formatErrorOrWarningMessage('warning', `Not found ISBN ${isbn}: Not available in Google Books or Open Library`)]);
          }
        }

        //other information needed for PrestaShop
        let active = 1, category = '', price_non_tax = sellingPrice, id_tax_rules_group = 1, wholesale_price = purchasePrice, on_sale = 0, reduction_price = 0, reduction_percent = 0, reduction_from = '', reduction_to = '', reference = isbn13, supplier_reference = '', supplier = '', manufacturer = '', ean13 = '', upc = '', mpn = '', ecotax = '', width = 0, height = 0, depth = 0, weight = 0, delivery_in_stock = '', delivery_out_stock = '', minimal_quantity = 1, low_stock_threshold = 0, low_stock_alert = 1, visibility = 'both', additional_shipping_cost = 0, unity = '', unit_price = 0, description_short = '', description = summary, meta_title = '', meta_keywords = tags, meta_description = '', link_rewrite = '', available_now = 'In Stock', available_later = '', available_for_order = 1, available_date = '', date_add = '', show_price = 1, image_alt = '', delete_existing_images = 0, features = '';

        //create features for PrestaShop
        features = Util.createFeaturesString(authors, publisher, isbn13, isbn10, pages, publishedDate, maturityRating);

        if (bookFound) {
          setBookData((prevData) => [...prevData, {
            key: id, active, name, category, price_non_tax, id_tax_rules_group, wholesale_price, on_sale, reduction_price, reduction_percent, reduction_from, reduction_to, reference, supplier_reference, supplier, manufacturer, ean13, upc, mpn, ecotax, width, height, depth, weight, delivery_in_stock, delivery_out_stock, quantity, minimal_quantity, low_stock_threshold, low_stock_alert, visibility, additional_shipping_cost, unity, unit_price, description_short, description, tags, meta_title, meta_keywords, meta_description, link_rewrite, available_now, available_later, available_for_order, available_date, date_add, show_price, image, image_alt, delete_existing_images, features, authors, publisher, isbn10, isbn13, pages, publishedDate, maturityRating, source
          }]);
        }

        setCurrentRowNumber(row - 1);
        setProgress(Math.round((row / totalRows) * 100));
      } catch (error) {
        setErrors((prevErrors) => [...prevErrors, Util.formatErrorOrWarningMessage('error', `Error processing ISBN ${isbn}: ${error.message}`)]);
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

  const handleExportData = () => {
    //custom header
    const heading = [['ID', 'Active (0/1)', 'Name', 'Categories (x,y,z...)', 'Price tax excluded', 'Tax rule ID', 'Cost price', 'On sale (0/1)', 'Discount amount', 'Discount percent', 'Discount from (yyyy-mm-dd)', 'Discount to (yyyy-mm-dd)', 'Reference #', 'Supplier reference #', 'Supplier', 'Brand', 'EAN-13', 'UPC', 'MPN', 'Ecotax', 'Width', 'Height', 'Depth', 'Weight', 'Delivery time of in-stock products:', 'Delivery time of out-of-stock products with allowed orders:', 'Quantity', 'Minimal quantitly', 'Low stock level', 'Receive a low stock alert by email', 'Visibility', 'Additional shipping cost', 'Unit for base price', 'Base price', 'Summary', 'Description', 'Tags (x,y,z...)', 'Meta title', 'Meta keywords', 'Meta description', 'Rewritten URL', 'Label when in stock', 'Label when backorder allowed', 'Available for order (0 = No, 1 = Yes)', 'Product availability date', 'Product creation date', 'Show price (0 = No, 1 = Yes)', 'Image URLs (x,y,z...)', 'Image alt texts (x,y,z...)', 'Delete existing images (0 = No, 1 = Yes)', 'Feature (Name:Value:Position:Customized)', 'Author(s)', 'Publisher', 'ISBN 10', 'ISBN 13', 'Pages', 'Published Date', 'Maturity Rating', 'Source']];

    //New workbook and add our custom header
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, heading);

    //Avoid overriding and skipping headers
    XLSX.utils.sheet_add_json(worksheet, bookData, {
      origin: 'A2',
      skipHeader: true
    });

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

    const logo = document.getElementById('logo');
    if (progress > 0 && progress < 100) {
      logo.classList.remove('App-logo-spin');
      logo.classList.add('App-logo-heartBeat');
    } else {
      logo.classList.remove('App-logo-heartBeat');
      logo.classList.add('App-logo-spin');
    }
  }, [progress]);

  return (
    <div className='container d-flex w-100 h-100 p-3 mx-auto flex-column'>
      <main className='px-3'>
        <div>
          <img id="logo" src={logo} className="App-logo" alt="logo" />
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
                    Errors / Warnings
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
          <DataTable dataSource={bookData} handleData={handleExportData} processCompleted={progress === 100} />
        )}
      </main>
      <footer className="mt-auto text-white-50">
        <p>Book Info Extractor by Ratul Paul using <a href="https://reactjs.org" target="_blank" className="text-white" rel='noreferrer'>React</a>.</p>
      </footer>
    </div>
  );
}

export default App;