const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const HealthcareProviders = require('../../models/HealthcareProviders');
const Users = require('../../models/Users');
const { createToken } = require('../../helpers/tokens');

let testUserToken;

beforeAll(async () => {
    await db.query("DELETE FROM users");
    await db.query("DELETE FROM healthcareproviders");

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

    await HealthcareProviders.create({
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

describe("POST /search", function () {
    test("works for searching providers", async function () {
        const response = await request(app)
            .post('/search')
            .send({ healthIssue: "mental health" });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("providers");
        expect(response.body.providers.length).toBeGreaterThan(0);
    });
});
