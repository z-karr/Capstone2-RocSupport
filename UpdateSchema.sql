-- record of last update to database
-- Step 1: Add New Tables
CREATE TABLE IF NOT EXISTS PhoneNumbers (
    phone_id SERIAL PRIMARY KEY,
    country_code VARCHAR(5) NOT NULL,
    area_code VARCHAR(10),
    phone_number VARCHAR(20) NOT NULL,
    phone_type VARCHAR(20) NOT NULL
);
CREATE TABLE IF NOT EXISTS Addresses (
    address_id SERIAL PRIMARY KEY,
    street_address VARCHAR(255) NOT NULL,
    apartment_number VARCHAR(20),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20)
);
CREATE TABLE IF NOT EXISTS ProviderSupportedIssues (
    provider_id INT NOT NULL REFERENCES HealthcareProviders(HealthcareProvider_id),
    issue_id INT NOT NULL REFERENCES MedicalIssues(issue_id),
    PRIMARY KEY (provider_id, issue_id)
);
-- Step 2: Modify Existing Tables
ALTER TABLE Users
ADD COLUMN IF NOT EXISTS addressID INT,
    ADD COLUMN IF NOT EXISTS phoneID INT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE HealthcareProviders
ADD COLUMN IF NOT EXISTS addressID INT,
    ADD COLUMN IF NOT EXISTS phoneID INT,
    ADD COLUMN IF NOT EXISTS supported_health_issuesID INT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- Step 3: Create Foreign Key Relationships
ALTER TABLE Users
ADD CONSTRAINT IF NOT EXISTS fk_user_address FOREIGN KEY (addressID) REFERENCES Addresses(address_id);
ALTER TABLE Users
ADD CONSTRAINT IF NOT EXISTS fk_user_phone FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id);
ALTER TABLE HealthcareProviders
ADD CONSTRAINT IF NOT EXISTS fk_provider_address FOREIGN KEY (addressID) REFERENCES Addresses(address_id);
ALTER TABLE HealthcareProviders
ADD CONSTRAINT IF NOT EXISTS fk_provider_phone FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id);
ALTER TABLE HealthcareProviders
ADD CONSTRAINT IF NOT EXISTS fk_provider_medical_issue FOREIGN KEY (supported_health_issuesID) REFERENCES MedicalIssues(issue_id);
-- Step 4: Modify Existing Tables
ALTER TABLE Users
ADD COLUMN IF NOT EXISTS addressID INT,
    ADD COLUMN IF NOT EXISTS phoneID INT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE HealthcareProviders
ADD COLUMN IF NOT EXISTS addressID INT,
    ADD COLUMN IF NOT EXISTS phoneID INT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- Remove the redundant column
ALTER TABLE HealthcareProviders DROP COLUMN IF EXISTS supported_health_issuesID;
-- Step 5: Create Foreign Key Relationships
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_user_address'
) THEN
ALTER TABLE Users
ADD CONSTRAINT fk_user_address FOREIGN KEY (addressID) REFERENCES Addresses(address_id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_user_phone'
) THEN
ALTER TABLE Users
ADD CONSTRAINT fk_user_phone FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_provider_address'
) THEN
ALTER TABLE HealthcareProviders
ADD CONSTRAINT fk_provider_address FOREIGN KEY (addressID) REFERENCES Addresses(address_id);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_provider_phone'
) THEN
ALTER TABLE HealthcareProviders
ADD CONSTRAINT fk_provider_phone FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id);
END IF;
-- Remove the constraint for the column we're dropping
IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_provider_medical_issue'
) THEN
ALTER TABLE HealthcareProviders DROP CONSTRAINT fk_provider_medical_issue;
END IF;
END $$;
-- Step 6
-- Remove the foreign key constraint if it exists
ALTER TABLE HealthcareProviders DROP CONSTRAINT IF EXISTS fk_provider_user;
-- Remove the unique constraint on user_id if it exists
ALTER TABLE HealthcareProviders DROP CONSTRAINT IF EXISTS user_id_index;
-- Remove the user_id column
ALTER TABLE HealthcareProviders DROP COLUMN IF EXISTS user_id;
-- Step 7
-- Add email and password columns
ALTER TABLE HealthcareProviders 
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS password VARCHAR(100);

-- Make email NOT NULL after adding it (in case there's existing data)
ALTER TABLE HealthcareProviders 
ALTER COLUMN email SET NOT NULL;

-- Add UNIQUE constraint to email
ALTER TABLE HealthcareProviders 
ADD CONSTRAINT healthcareproviders_email_key UNIQUE (email);

-- Make password NOT NULL
ALTER TABLE HealthcareProviders 
ALTER COLUMN password SET NOT NULL;
-- -- record of last update to database
-- -- Step 1: Add New Tables
-- CREATE TABLE IF NOT EXISTS PhoneNumbers (
--     phone_id SERIAL PRIMARY KEY,
--     country_code VARCHAR(5) NOT NULL,
--     area_code VARCHAR(10),
--     phone_number VARCHAR(20) NOT NULL,
--     phone_type VARCHAR(20) NOT NULL
-- );
-- CREATE TABLE IF NOT EXISTS Addresses (
--     address_id SERIAL PRIMARY KEY,
--     street_address VARCHAR(255) NOT NULL,
--     apartment_number VARCHAR(20),
--     city VARCHAR(100) NOT NULL,
--     state VARCHAR(100),
--     postal_code VARCHAR(20)
-- );
-- -- Step 2: Modify Existing Tables
-- ALTER TABLE Users
-- ADD COLUMN IF NOT EXISTS addressID INT,
--     ADD COLUMN IF NOT EXISTS phoneID INT,
--     ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- ALTER TABLE HealthcareProviders
-- ADD COLUMN IF NOT EXISTS addressID INT,
--     ADD COLUMN IF NOT EXISTS phoneID INT,
--     ADD COLUMN IF NOT EXISTS supported_health_issuesID INT,
--     ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- -- Step 3: Create Foreign Key Relationships
-- ALTER TABLE Users
-- ADD CONSTRAINT IF NOT EXISTS fk_user_address FOREIGN KEY (addressID) REFERENCES Addresses(address_id);
-- ALTER TABLE Users
-- ADD CONSTRAINT IF NOT EXISTS fk_user_phone FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id);
-- ALTER TABLE HealthcareProviders
-- ADD CONSTRAINT IF NOT EXISTS fk_provider_address FOREIGN KEY (addressID) REFERENCES Addresses(address_id);
-- ALTER TABLE HealthcareProviders
-- ADD CONSTRAINT IF NOT EXISTS fk_provider_phone FOREIGN KEY (phoneID) REFERENCES PhoneNumbers(phone_id);
-- ALTER TABLE HealthcareProviders
-- ADD CONSTRAINT IF NOT EXISTS fk_provider_medical_issue FOREIGN KEY (supported_health_issuesID) REFERENCES MedicalIssues(issue_id);