-- Contact/Messaging System Schema
-- This adds tables for patients to contact providers

BEGIN;

-- Table for storing contact requests from patients to providers
CREATE TABLE IF NOT EXISTS ProviderContacts (
    contact_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    provider_id INT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    patient_email VARCHAR(100) NOT NULL,
    patient_phone VARCHAR(20),
    preferred_contact_method VARCHAR(20) CHECK (preferred_contact_method IN ('email', 'phone', 'either')),
    urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'responded', 'closed')),
    provider_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES HealthcareProviders(provider_id) ON DELETE CASCADE
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_provider_contacts_provider ON ProviderContacts(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_contacts_patient ON ProviderContacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_provider_contacts_status ON ProviderContacts(status);
CREATE INDEX IF NOT EXISTS idx_provider_contacts_created ON ProviderContacts(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_provider_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    IF OLD.status != NEW.status AND NEW.status = 'responded' THEN
        NEW.responded_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update timestamps
DROP TRIGGER IF EXISTS update_provider_contacts_updated_at_trigger ON ProviderContacts;
CREATE TRIGGER update_provider_contacts_updated_at_trigger
    BEFORE UPDATE ON ProviderContacts
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_contacts_updated_at();

COMMIT;