import axios from 'axios'; // For API calls

export const getBookDataFromGoogleAPI = async (isbn) => {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const response = await axios.get(apiUrl); // TODO: Handle errors and retries

    return response.data;
  };

  export const getBookDataFromOpenLibraryAPI = async (isbn) => {
    const apiUrl = `https://openlibrary.org/search.json?q=${isbn}&fields=*&limit=1`;
    const response = await axios.get(apiUrl); // TODO: Handle errors and retries

    return response.data;
  };