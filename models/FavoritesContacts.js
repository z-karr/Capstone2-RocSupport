"use strict";

const db = require("../db");
const {
    BadRequestError,
    NotFoundError
} = require("../expressError");

/** Related functions for managing FavoritesContacts */

class FavoritesContacts {
    /** Create a favorite contact (favorite_id will be auto-generated)
     *
     * data should be { civilian_user_id, provider_id }
     *
     * Returns { favorite_id, civilian_user_id, provider_id }
     **/
    static async create({ civilian_user_id, provider_id }) {
        const result = await db.query(
            `INSERT INTO FavoritesContacts (civilian_user_id, provider_id)
             VALUES ($1, $2)
             RETURNING favorite_id, civilian_user_id, provider_id`,
            [civilian_user_id, provider_id],
        );
        const favoriteContact = result.rows[0];

        return favoriteContact;
    }

    /** Delete a favorite contact from the database.
     *
     * Returns { deleted: favorite_id }
     **/
    static async remove(favorite_id) {
        const result = await db.query(
            `DELETE
             FROM FavoritesContacts
             WHERE favorite_id = $1
             RETURNING favorite_id`,
            [favorite_id],
        );
        const deletedFavorite = result.rows[0];

        if (!deletedFavorite) throw new NotFoundError(`No favorite contact found with id: ${favorite_id}`);

        return { deleted: deletedFavorite.favorite_id };
    }
}

module.exports = FavoritesContacts;
