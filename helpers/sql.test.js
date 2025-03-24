const { sqlForPartialUpdate } = require('helpers/sql.js');
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", () => {
    test("works: normal case", () => {
        const dataToUpdate = { username: 'John', email: 'John@gmail.com' };
        const jsToSql = { username: "new_username", email: "new_email" };
        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(setCols).toEqual('"new_username"=$1, "new_email"=$2');
        expect(values).toEqual(['John', 'John@gmail.com']);
    });

    test("throws BadRequestError if no data", () => {
        expect(() => sqlForPartialUpdate({}, { username: "new_username", email: "new_email" })).toThrow(BadRequestError);
    });
});
