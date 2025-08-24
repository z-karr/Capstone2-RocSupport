"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
    authenticateJWT,
    ensureLoggedIn,
    ensureUserType,
    ensureCorrectProvider,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


describe("authenticateJWT", function () {
    test("works: via header", function () {
        expect.assertions(2);
        //there are multiple ways to pass an authorization token, this is how you pass it in the header.
        //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
        const req = { headers: { authorization: `Bearer ${testJwt}` } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        authenticateJWT(req, res, next);
        expect(res.locals).toEqual({
            user: {
                iat: expect.any(Number),
                username: "test",
                isAdmin: false,
            },
        });
    });

    test("works: no header", function () {
        expect.assertions(2);
        const req = {};
        const res = { locals: {} };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        authenticateJWT(req, res, next);
        expect(res.locals).toEqual({});
    });

    test("works: invalid token", function () {
        expect.assertions(2);
        const req = { headers: { authorization: `Bearer ${badJwt}` } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        authenticateJWT(req, res, next);
        expect(res.locals).toEqual({});
    });
});


describe("ensureLoggedIn", function () {
    test("works", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: { user: { username: "test", is_admin: false } } };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureLoggedIn(req, res, next);
    });

    test("unauth if no login", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: {} };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        expect(() => {
            ensureLoggedIn(req, res, next);
        }).toThrow(UnauthorizedError);
    });
});


describe("ensureUserType", function () {
    test("works for correct type", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: { user: { username: "test", type: "provider" } } };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        const middleware = ensureUserType("provider");
        middleware(req, res, next);
    });

    test("unauth if wrong type", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: { user: { username: "test", type: "patient" } } };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        const middleware = ensureUserType("provider");
        expect(() => {
            middleware(req, res, next);
        }).toThrow(UnauthorizedError);
    });

    test("unauth if anon", function () {
        expect.assertions(1);
        const req = {};
        const res = { locals: {} };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        const middleware = ensureUserType("provider");
        expect(() => {
            middleware(req, res, next);
        }).toThrow(UnauthorizedError);
    });
});


describe("ensureCorrectProvider", function () {
    test("works for logged in user", function () {
        expect.assertions(1);
        const req = { params: { user_id: "1" } };
        const res = { locals: { user: { user_id: 1, type: "provider" } } };
        const next = function (err) {
            expect(err).toBeFalsy();
        };
        ensureCorrectProvider(req, res, next);
    });

    test("unauth: if anon", function () {
        expect.assertions(1);
        const req = { params: { user_id: "1" } };
        const res = { locals: {} };
        const next = function (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        };
        expect(() => {
            ensureCorrectProvider(req, res, next);
        }).toThrow(UnauthorizedError);
    });
});
