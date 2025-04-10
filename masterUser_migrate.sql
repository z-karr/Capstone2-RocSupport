start TRANSACTION;

-- Step 1: Create the master Users table
CREATE TABLE MasterUsers (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Rename current Users table to Patients and modify structure
-- First, create new Patients table
CREATE TABLE Patients (
    patient_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    bio TEXT,
    addressID INT,
    phoneID INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES MasterUsers(user_id) ON DELETE CASCADE,
    FOREIGN KEY (addressID) REFERENCES Addresses(address_id),
    FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id)
);

-- Step 3: Modify HealthcareProviders to reference master users
-- First, create a new table
CREATE TABLE HealthcareProvidersNew (
    provider_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    provider_type VARCHAR(50) NOT NULL,
    bio TEXT,
    contact_information VARCHAR(255),
    addressID INT,
    phoneID INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES MasterUsers(user_id) ON DELETE CASCADE,
    FOREIGN KEY (addressID) REFERENCES Addresses(address_id),
    FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id)
);

-- Step 4: Update ProviderSupportedIssues to reference the new provider_id column
CREATE TABLE ProviderSupportedIssuesNew (
    provider_id INT NOT NULL REFERENCES HealthcareProvidersNew(provider_id) ON DELETE CASCADE,
    issue_id INT NOT NULL REFERENCES MedicalIssues(issue_id) ON DELETE CASCADE,
    PRIMARY KEY (provider_id, issue_id)
);

-- Step 5: Update FavoritesContacts to reference the new IDs
CREATE TABLE FavoritesContactsNew (
    favorite_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES Patients(patient_id) ON DELETE CASCADE,
    provider_id INT NOT NULL REFERENCES HealthcareProvidersNew(provider_id) ON DELETE CASCADE
);

-- Drop old tables and constraints
DROP TABLE FavoritesContacts;
DROP TABLE ProviderSupportedIssues;
DROP TABLE HealthcareProviders;
DROP TABLE Users;

-- Rename new tables
ALTER TABLE FavoritesContactsNew RENAME TO FavoritesContacts;
ALTER TABLE ProviderSupportedIssuesNew RENAME TO ProviderSupportedIssues;
ALTER TABLE HealthcareProvidersNew RENAME TO HealthcareProviders;

COMMIT;