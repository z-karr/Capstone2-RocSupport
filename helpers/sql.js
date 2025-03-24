const { BadRequestError } = require("../expressError");

/**
 * Helper for making selective update queries.
 *
 * The calling function can use it to make the SET clause of an SQL UPDATE
 * statement.
 *
 * @param dataToUpdate {Object} {field1: newVal, field2: newVal, ...}
 * @param jsToSql {Object} maps js-style data fields to database column names,
 *   like { username: "new_username", email: "new_email" }
 *
 * @returns {Object} {sqlSetCols, dataToUpdate}
 *
 * @example {username: 'Aliya', email: 'Aliya@gmail.com'} =>
 *   { setCols: '"username"=$1, "email"=$2',
 *     values: ['Aliya', 'Aliya@gmail.com'] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) throw new BadRequestError("No data");

    // {username: 'Aliya', email: 'Aliya@gmail.com'} => ['"username"=$1', '"email"=$2']
    const cols = keys.map((colName, idx) =>
        `"${jsToSql[colName] || colName}"=$${idx + 1}`,
    );

    return {
        setCols: cols.join(", "),
        values: Object.values(dataToUpdate),
    };
}

module.exports = { sqlForPartialUpdate }