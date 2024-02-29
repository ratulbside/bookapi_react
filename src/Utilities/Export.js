import * as XLSX from 'xlsx'; // For Excel file creation

export const ExportDataAsExcel = (bookData) => {
    //custom header
    const heading = [['ID', 'Active (0/1)', 'Name', 'Categories (x,y,z...)', 'Price tax excluded', 'Tax rule ID', 'Cost price', 'On sale (0/1)', 'Discount amount', 'Discount percent', 'Discount from (yyyy-mm-dd)', 'Discount to (yyyy-mm-dd)', 'Reference #', 'Supplier reference #', 'Supplier', 'Brand', 'EAN-13', 'UPC', 'MPN', 'Ecotax', 'Width', 'Height', 'Depth', 'Weight', 'Delivery time of in-stock products', 'Delivery time of out-of-stock products with allowed orders', 'Quantity', 'Minimal quantitly', 'Low stock level', 'Receive a low stock alert by email', 'Visibility', 'Additional shipping cost', 'Unit for base price', 'Base price', 'Summary', 'Description', 'Tags (x,y,z...)', 'Meta title', 'Meta keywords', 'Meta description', 'Rewritten URL', 'Label when in stock', 'Label when backorder allowed', 'Available for order (0 = No, 1 = Yes)', 'Product availability date', 'Product creation date', 'Show price (0 = No, 1 = Yes)', 'Image URLs (x,y,z...)', 'Image alt texts (x,y,z...)', 'Delete existing images (0 = No, 1 = Yes)', 'Feature (Name:Value:Position:Customized)', 'Author(s)', 'Publisher', 'ISBN 10', 'ISBN 13', 'Pages', 'Published Date', 'Maturity Rating', 'Source', 'Status']];

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

export const exportDataAsJson = (bookData) => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
        JSON.stringify(bookData)
    )}`;
    const dataWrappedJsonString = `{'data':${jsonString}}`;
    const link = document.createElement("a");
    link.href = dataWrappedJsonString;
    link.download = "books.json";

    link.click();
};