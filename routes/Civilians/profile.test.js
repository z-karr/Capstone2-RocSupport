const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Users = require('../../models/Users');
const { createToken } = require('../../helpers/tokens');

let testUserToken;
let testUser;

beforeAll(async () => {
    await db.query("DELETE FROM users");

    testUser = await Users.register({
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
});

afterAll(async () => {
    await db.end();
});

describe("GET /profile", function () {
    test("works for logged-in user", async function () {
        const response = await request(app)
            .get('/profile')
            .set("Authorization", `Bearer ${testUserToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("user");
        expect(response.body.user.username).toBe("testuser");
    });

    test("fails for anonymous user", async function () {
        const response = await request(app)
            .get('/profile');
        expect(response.statusCode).toBe(401);
    });
});

describe("PATCH /profile", function () {
    test("works for logged-in user", async function () {
        const response = await request(app)
            .patch('/profile')
            .send({
                email: "newemail@test.com",
                bio: "Updated bio"
            })
            .set("Authorization", `Bearer ${testUserToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.user.email).toBe("newemail@test.com");
        expect(response.body.user.bio).toBe("Updated bio");
    });

    test("fails for anonymous user", async function () {
        const response = await request(app)
            .patch('/profile')
            .send({
                email: "newemail@test.com",
                bio: "Updated bio"
            });
        expect(response.statusCode).toBe(401);
    });
});
