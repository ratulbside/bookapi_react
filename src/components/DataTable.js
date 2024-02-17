import { Table, Button, ConfigProvider, theme } from 'antd'; // For table component

function DataTable({ dataSource, handleData }) {
    const { defaultAlgorithm, darkAlgorithm } = theme;

    const columns = [
        { title: 'ISBN', dataIndex: 'isbn10' },
        { title: 'Title', dataIndex: 'title' },
        { title: 'Publisher', dataIndex: 'publisher' },
        { title: 'Pages', dataIndex: 'pages' },
        { title: 'Authors', dataIndex: 'author' },
        { title: 'Price', dataIndex: 'price' },
        { title: 'Buying Price', dataIndex: 'buyingPrice' },
    ];

    return (
        <div>
            <ConfigProvider
                theme={{
                    algorithm: darkAlgorithm,
                }}>
                <Table columns={columns} dataSource={dataSource} />

                <Button onClick={handleData}>Export Data</Button>
            </ConfigProvider>
        </div>
    )
}

export default DataTable;