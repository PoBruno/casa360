-- Create the users
INSERT INTO users (username, email, password, full_name, email_verified)
VALUES
    ('joao', 'joao@example.com', '123', 'João Silva', TRUE),
    ('maria', 'maria@example.com', '123', 'Maria Santos', TRUE);

-- Store the user IDs for later use
DO $$
DECLARE
    joao_id UUID;
    maria_id UUID;
    casa_id UUID;
BEGIN
    -- Get the user IDs
    SELECT id INTO joao_id FROM users WHERE username = 'joao';
    SELECT id INTO maria_id FROM users WHERE username = 'maria';
    
    -- João creates a house called "casa"
    INSERT INTO houses (user_id, house_name, description)
    VALUES (joao_id, 'casa', 'Casa do João') 
    RETURNING id INTO casa_id;
    
    -- Grant Maria member permissions to the house
    -- Note: João already has owner permissions due to the after_insert_house trigger
    INSERT INTO house_users (user_id, house_id, role, invited_by, invitation_status)
    VALUES (maria_id, casa_id, 'member', joao_id, 'accepted');
END $$;

-- Verify the setup (optional)
SELECT 
    u.username, 
    h.house_name, 
    hu.role
FROM 
    house_users hu
JOIN 
    users u ON hu.user_id = u.id
JOIN 
    houses h ON hu.house_id = h.id
ORDER BY 
    h.house_name, hu.role DESC;
