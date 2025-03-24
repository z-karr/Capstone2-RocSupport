CREATE TABLE PhoneNumbers (
    phone_id SERIAL PRIMARY KEY,
    country_code VARCHAR(5) NOT NULL,
    area_code VARCHAR(10),
    phone_number VARCHAR(20) NOT NULL,
    phone_type VARCHAR(20) NOT null
);
CREATE TABLE Addresses (
    address_id SERIAL PRIMARY KEY,
    street_address VARCHAR(255) NOT NULL,
    apartment_number VARCHAR(20),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20)
);
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    bio TEXT,
    addressID INT,
    phoneID INT,
    isAdmin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_index UNIQUE (email),
    FOREIGN KEY (addressID) REFERENCES Addresses(address_id),
    FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id)
);
CREATE TABLE MedicalIssues (
    issue_id SERIAL PRIMARY KEY,
    issue_name VARCHAR(100) NOT NULL,
    description text
);
CREATE TABLE HealthcareProviders (
    HealthcareProvider_id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    bio TEXT,
    contact_information VARCHAR(255),
    addressID INT,
    phoneID INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (addressID) REFERENCES Addresses(address_id),
    FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id)
);
CREATE TABLE ProviderSupportedIssues (
    provider_id INT NOT NULL REFERENCES HealthcareProviders(HealthcareProvider_id),
    issue_id INT NOT NULL REFERENCES MedicalIssues(issue_id),
    PRIMARY KEY (provider_id, issue_id)
);
CREATE TABLE FavoritesContacts (
    favorite_id SERIAL PRIMARY KEY,
    civilian_user_id INT,
    provider_id INT,
    FOREIGN KEY (civilian_user_id) REFERENCES Users(user_id),
    FOREIGN KEY (provider_id) REFERENCES HealthcareProviders(HealthcareProvider_id)
);
-- -- Phone Numbers Table
-- CREATE TABLE PhoneNumbers (
--     phone_id SERIAL PRIMARY KEY,
--     country_code VARCHAR(5) NOT NULL,
--     -- Include country code
--     area_code VARCHAR(10),
--     -- Include area code
--     phone_number VARCHAR(20) NOT NULL,
--     phone_type VARCHAR(20) NOT NULL
-- ) --Address Table
-- CREATE TABLE Addresses (
--     address_id SERIAL PRIMARY KEY,
--     street_address VARCHAR(255) NOT NULL,
--     apartment_number VARCHAR(20),
--     -- Optional apartment number
--     city VARCHAR(100) NOT NULL,
--     state VARCHAR(100),
--     postal_code VARCHAR(20),
-- ) -- Users Table
-- CREATE TABLE Users (
--     user_id SERIAL PRIMARY KEY,
--     username VARCHAR(50) NOT NULL,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     -- Indexed below
--     password VARCHAR(100) NOT NULL,
--     -- Hashed password
--     type VARCHAR(20) NOT NULL,
--     -- 'civilian' or 'provider'
--     bio TEXT,
--     addressID INT,
--     -- Foreign Key referenced below
--     phoneID INT,
--     -- Foreign Key referenced below
--     isAdmin BOOLEAN DEFAULT FALSE,
--     -- Admin status of the user
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     -- Log creation timestamp of new data
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     -- Log update timestamp of new data
--     CONSTRAINT email_index UNIQUE (email),
--     -- Indexing the email column
--     FOREIGN KEY (addressID) REFERENCES Addresses(address_id),
--     -- References Addresses table
--     FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id) -- References PhoneNumbers table
-- );
-- -- Healthcare Providers Table
-- CREATE TABLE HealthcareProviders (
--     HealthcareProvider_id SERIAL PRIMARY KEY,
--     user_id INT,
--     -- Indexed below
--     FOREIGN KEY (user_id) REFERENCES Users(user_id),
--     provider_type VARCHAR(50) NOT NULL,
--     -- 'Individual Provider', 'healthcare system/org', 'holistic providers/orgs'
--     name VARCHAR(100) NOT NULL,
--     bio TEXT,
--     contact_information VARCHAR(255),
--     addressID INT,
--     -- Foreign Key referenced below
--     phoneID INT,
--     -- Foreign Key referenced below
--     supported_health_issuesID INT,
--     -- Foreign Key referenced below
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     -- Log creation timestamp of new data
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     -- Log update timestamp of new data
--     CONSTRAINT user_id_index UNIQUE (user_id),
--     -- Indexing the 'used_id' column
--     FOREIGN KEY (addressID) REFERENCES Addresses(address_id),
--     -- References Address table
--     FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id) -- References PhoneNumbers table
--     FOREIGN KEY (supported_health_issuesID) REFERENCES MedicalIssues(issue_id) -- References MedicalIssues table
-- );
-- -- Medical Issues Table
-- CREATE TABLE MedicalIssues (
--     issue_id SERIAL PRIMARY KEY,
--     issue_name VARCHAR(100) NOT NULL,
--     description TEXT
-- );
-- -- Emergency Resources Table
-- CREATE TABLE EmergencyResources (
--     resource_id SERIAL PRIMARY KEY,
--     resource_name VARCHAR(100) NOT NULL,
--     phone_number VARCHAR(20) NOT NULL,
--     -- this won't be referenced from Phone number table, doesn't need to be phoneID
--     description TEXT
-- );
-- -- Favorites/Contacts Table
-- CREATE TABLE FavoritesContacts (
--     favorite_id SERIAL PRIMARY KEY,
--     civilian_user_id INT,
--     FOREIGN KEY (civilian_user_id) REFERENCES Users(user_id),
--     provider_id INT,
--     FOREIGN KEY (provider_id) REFERENCES HealthcareProviders(HealthcareProvider_id)
-- );


-- ProviderProfileUpdate.schema , saving here while making changes to test
-- {
--     "$schema": "http://json-schema.org/draft-07/schema#",
--     "title": "ProviderProfileUpdate",
--     "type": "object",
--     "properties": {
--         "name": {
--             "type": "string",
--             "minLength": 1,
--             "maxLength": 50
--         },
--         "email": {
--             "type": "string",
--             "format": "email",
--             "maxLength": 100
--         },
--         "bio": {
--             "type": "string"
--         },
--         "contact_information": {
--             "type": "string",
--             "maxLength": 255
--         },
--         "address": {
--             "$ref": "./address.json"
--         },
--         "phone": {
--             "$ref": "./phone.json"
--         }
--     },
--     "required": [
--         "name",
--         "email"
--     ]
-- }