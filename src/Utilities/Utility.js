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