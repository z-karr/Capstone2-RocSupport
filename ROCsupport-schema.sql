BEGIN;

-- Keep these existing tables unchanged
-- PhoneNumbers and Addresses tables remain as they are
-- MedicalIssues table remains as it is

-- Step 1: Create the master Users table
CREATE TABLE MasterUsers (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('patient', 'provider')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Rename current Users table to Patients and modify structure
-- First, create new Patients table
CREATE TABLE Patients (
    patient_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
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

CREATE TABLE medicalissuesNew (
	issue_id serial4 NOT NULL,
	issue_name varchar(100) NOT NULL,
	description text NULL,
	CONSTRAINT medicalissues_pkey PRIMARY KEY (issue_id)
);

-- Populate MasterUsers from existing Users and HealthcareProviders
INSERT INTO MasterUsers (email, password, name, type)
SELECT email, password, username, 'patient' FROM Users;

INSERT INTO MasterUsers (email, password, name, type)
SELECT email, password, name, 'provider' FROM HealthcareProviders;

-- Populate Patients table
INSERT INTO Patients (user_id, username, bio, addressID, phoneID, created_at, updated_at)
SELECT 
    m.user_id, 
    u.username, 
    u.bio, 
    u.addressID, 
    u.phoneID,
    u.created_at,
    u.updated_at
FROM Users u
JOIN MasterUsers m ON u.email = m.email;

-- Populate HealthcareProvidersNew table
INSERT INTO HealthcareProvidersNew (user_id, provider_type, bio, contact_information, addressID, phoneID, created_at, updated_at)
SELECT 
    m.user_id, 
    h.provider_type, 
    h.bio, 
    h.contact_information, 
    h.addressID, 
    h.phoneID,
    h.created_at,
    h.updated_at
FROM HealthcareProviders h
JOIN MasterUsers m ON h.email = m.email;

-- Update ProviderSupportedIssues
INSERT INTO ProviderSupportedIssuesNew (provider_id, issue_id)
SELECT 
    hn.provider_id, 
    p.issue_id
FROM ProviderSupportedIssues p
JOIN HealthcareProviders h ON p.provider_id = h.HealthcareProvider_id
JOIN MasterUsers m ON h.email = m.email
JOIN HealthcareProvidersNew hn ON hn.user_id = m.user_id;

-- Update FavoritesContacts
INSERT INTO FavoritesContactsNew (patient_id, provider_id)
SELECT 
    p.patient_id, 
    hp.provider_id
FROM FavoritesContacts f
JOIN Users u ON f.civilian_user_id = u.user_id
JOIN MasterUsers mu ON u.email = mu.email
JOIN Patients p ON p.user_id = mu.user_id
JOIN HealthcareProviders h ON f.provider_id = h.HealthcareProvider_id
JOIN MasterUsers mp ON h.email = mp.email
JOIN HealthcareProvidersNew hp ON hp.user_id = mp.user_id;

INSERT INTO medicalissuesNew (issue_name,description) VALUES
	 ('Addiction','General addiction issues'),
	 ('Alcoholism','Alcohol-specific addiction'),
	 ('Alcohol Dependency','Dependency on alcohol'),
	 ('Anger Management','Techniques to control and manage anger'),
	 ('Anxiety','Various anxiety disorders'),
	 ('Chemical Dependency','Dependency on chemical substances'),
	 ('Depression','Various depressive disorders'),
	 ('Drug Dependency','Dependency on drugs'),
	 ('Family Medicine','General family medical issues'),
	 ('Mental Health','Various mental health concerns'),
     ('Opiate Addiction','Addiction specific to opiates'),
	 ('Pain Management','Chronic and acute pain management'),
	 ('Physical Therapy','Physical rehabilitation and therapy'),
	 ('Post-Traumatic Stress Disorder (PTSD)','Treatment for trauma-related stress disorders'),
	 ('Psychiatry','Medical specialty dealing with mental health disorders'),
	 ('Sexual Assault Recovery','Specialized support for sexual assault survivors'),
	 ('Substance Abuse','Abuse of various substances'),
	 ('Therapy','Various forms of psychological treatment'),
	 ('Trauma-Informed Care','Approach recognizing the impact of trauma'),
	 ('Women''s Health','Comprehensive health services for women');


-- Drop old tables and constraints
DROP TABLE FavoritesContacts;
DROP TABLE ProviderSupportedIssues;
DROP TABLE medicalissues;
DROP TABLE HealthcareProviders;
DROP TABLE Users;


-- Rename new tables
ALTER TABLE FavoritesContactsNew RENAME TO FavoritesContacts;
ALTER TABLE ProviderSupportedIssuesNew RENAME TO ProviderSupportedIssues;
ALTER TABLE medicalissuesNew RENAME TO medicalissues;
ALTER TABLE HealthcareProvidersNew RENAME TO HealthcareProviders;

-- Verify the migration was successful
SELECT COUNT(*) AS master_users_count FROM MasterUsers;
SELECT COUNT(*) AS patients_count FROM Patients;
SELECT COUNT(*) AS providers_count FROM HealthcareProviders;

COMMIT;

