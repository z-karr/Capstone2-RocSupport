const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Users = require('../../models/Users');
const HealthcareProviders = require('../../models/HealthcareProviders');
const { createToken } = require('../../helpers/tokens');

let testUserToken;
let testProvider;

beforeAll(async () => {
    await db.query("DELETE FROM users");
    await db.query("DELETE FROM healthcareproviders");
    await db.query("DELETE FROM favoritescontacts");

    const testUser = await Users.register({
        username: "testuser",
        email: "test@test.com",
        password: "password",
        type: "civilian",
        bio: "I am a test user.",
        address: {
            street_address: "123 Test St",
            apartment_number: "1",
            city: "Test City",
            state: "TS",
            postal_code: "12345"
        },
        phone: {
            country_code: "+1",
            area_code: "123",
            phone_number: "4567890",
            phone_type: "mobile"
        }
    });
    testUserToken = createToken(testUser);

    testProvider = await HealthcareProviders.create({
        user_id: testUser.id,
        provider_type: "Individual Provider",
        name: "Test Provider",
        bio: "I am a test provider.",
        contact_information: "testprovider@test.com",
        addressID: 1,
        phoneID: 1,
        support_health_issuesID: 1
    });
});

afterAll(async () => {
    await db.end();
});

describe("POST /favorites", function () {
    test("works for logged-in users", async function () {
        const response = await request(app)
            .post('/favorites')
            .send({ providerId: testProvider.id })
            .set("Authorization", `Bearer ${testUserToken}`);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("favorite");
    });

    test("fails for anonymous users", async function () {
        const response = await request(app)
            .post('/favorites')
            .send({ providerId: testProvider.id });
        expect(response.statusCode).toBe(401);
    });
});

describe("DELETE /favorites/:favoriteId", function () {
    test("works for logged-in users", async function () {
        const favoriteResponse = await request(app)
            .post('/favorites')
            .send({ providerId: testProvider.id })
            .set("Authorization", `Bearer ${testUserToken}`);
        const favoriteId = favoriteResponse.body.favorite.favorite_id;

        const response = await request(app)
            .delete(`/favorites/${favoriteId}`)
            .set("Authorization", `Bearer ${testUserToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: "Provider removed from favorites" });
    });

    test("fails for anonymous users", async function () {
        const favoriteResponse = await request(app)
            .post('/favorites')
            .send({ providerId: testProvider.id })
            .set("Authorization", `Bearer ${testUserToken}`);
        const favoriteId = favoriteResponse.body.favorite.favorite_id;

        const response = await request(app)
            .delete(`/favorites/${favoriteId}`);
        expect(response.statusCode).toBe(401);
    });
});
