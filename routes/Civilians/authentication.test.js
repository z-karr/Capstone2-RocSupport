const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const Users = require('../../models/Users');

beforeAll(async () => {
    await db.query("DELETE FROM users");
});

afterAll(async () => {
    await db.end();
});

describe("POST /auth/signup", function () {
    test("works for new users", async function () {
        const response = await request(app)
            .post('/auth/signup')
            .send({
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
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("token");
    });

    test("fails for duplicate users", async function () {
        await Users.register({
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
        const response = await request(app)
            .post('/auth/signup')
            .send({
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
        expect(response.statusCode).toBe(400);
    });
});

describe("POST /auth/login", function () {
    test("works for correct credentials", async function () {
        await Users.register({
            username: "testloginuser",
            email: "testlogin@test.com",
            password: "password",
            type: "civilian",
            bio: "I am a test login user.",
            address: {
                street_address: "123 Login St",
                apartment_number: "1",
                city: "Login City",
                state: "LN",
                postal_code: "12345"
            },
            phone: {
                country_code: "+1",
                area_code: "123",
                phone_number: "4567890",
                phone_type: "mobile"
            }
        });
        const response = await request(app)
            .post('/auth/login')
            .send({
                username: "testloginuser",
                password: "password"
            });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("token");
    });

    test("fails for incorrect credentials", async function () {
        const response = await request(app)
            .post('/auth/login')
            .send({
                username: "wronguser",
                password: "wrongpassword"
            });
        expect(response.statusCode).toBe(401);
    });
});
