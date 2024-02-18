import { Table, Button, ConfigProvider, theme } from 'antd'; // For table component

function DataTable({ dataSource, handleData }) {
    const { defaultAlgorithm, darkAlgorithm } = theme;

    const columns = [
        { id: 'ID', dataIndex: 'id' },
        { title: 'Title', dataIndex: 'title' },
        { title: 'Authors', dataIndex: 'authors' },
        { title: 'Publisher', dataIndex: 'publisher' },
        // { title: 'ISBN10', dataIndex: 'isbn10' },
        { title: 'ISBN13', dataIndex: 'isbn13' },
        { title: 'Pages', dataIndex: 'pages' },
        { title: 'Published Date', dataIndex: 'publishedDate' },
        // { title: 'Description', dataIndex: 'description' },
        // { title: 'Categories', dataIndex: 'categories' },
        // { title: 'Maturity Rating', dataIndex: 'maturityRating' },
        { title: 'Image', dataIndex: 'image' },
        // { title: 'Price', dataIndex: 'sellingPrice' },
        // { title: 'Purchase Price', dataIndex: 'purchasePrice' },
        // { title: 'Stock', dataIndex: 'stock' },
        { title: 'Source', dataIndex: 'source' },
    ];

    return (
        <div>
            <ConfigProvider
                theme={{
                    algorithm: darkAlgorithm,
                }}>
                <Table columns={columns} dataSource={dataSource} />

                <Button onClick={handleData} className='mb-4'>Export Data</Button>
            </ConfigProvider>
        </div>
    )
}

export default DataTable;