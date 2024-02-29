import { Badge } from 'reactstrap';

export function removeTextAndConvertToNumber(text) {
    // Remove all characters except numbers, ".", "+" or "-".
    const numberString = text.replace(/[^0-9\-+\.]/g, "");

    // If the string is empty or contains only non-numeric characters, return null.
    if (!numberString) {
        return null;
    }

    // Try to convert the string to a number.
    return parseFloat(numberString);
}

export function arrayToString(array) {
    return array ? array.join(', ') : '';
}

/**
 * Formats an error or warning message with the specified level and message.
 *
 * @param {string} level - The level of the message, either 'error' or 'warning'
 * @param {string} message - The content of the message
 * @return {JSX.Element} The formatted error or warning message
 */
export function formatErrorOrWarningMessage(level, message) {
    return (
        <span>
            <Badge color={(level === 'error' ? 'danger' : 'warning')}>
                {(level === 'error' ? 'Error' : 'Warning')}
            </Badge> {' ' + message}
        </span>
    );
}

/**
* Retrieve the book title with optional subtitle.
*
* @param {string} title - the main title of the book
* @param {string} subtitle - the optional subtitle of the book
* @return {string} the complete book title including the subtitle if available
*/
export function getBookTitle(titleNode, subtitleNode) {
    const title = titleNode || '';
    const subtitle = subtitleNode || '';
    return subtitle ? `${title} - ${subtitle}` : title;
}

export function createFeaturesString(authors, publisher, isbn13, isbn10, pages, publishedDate, maturityRating) {
    const features = [];

    if (authors && authors.trim()) {
        features.push(`Author(s):${authors.trim()}:1:1`);
    }

    if (publisher && publisher.trim()) {
        features.push(`Publisher:${publisher.trim()}:2:0`);
    }

    if (isbn13 && isbn13.toString().trim()) {
        features.push(`ISBN13:${isbn13.toString().trim()}:3:1`);
    }

    if (isbn10 && isbn10.toString().trim()) {
        features.push(`ISBN10:${isbn10.toString().trim()}:4:1`);
    }

    if (pages && pages.toString().trim()) {
        features.push(`Pages:${pages.toString().trim()}:5:1`);
    }

    if (publishedDate && publishedDate.toString().trim()) {
        features.push(`published Date:${publishedDate.toString().trim()}:6:1`);
    }

    if (maturityRating && maturityRating.trim()) {
        features.push(`Maturity Rating:${publishedDate.trim()}:7:1`);
    }

    return features.join(process.env.REACT_APP_FIELD_SEPARATOR);
}