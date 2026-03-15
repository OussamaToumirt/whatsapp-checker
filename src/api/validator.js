export const validatePhoneNumber = async (apiKey, phoneNumber) => {
  try {
    const response = await fetch('/api/v1/validate/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: phoneNumber })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API Key');
      }
      if (response.status === 402) {
        throw new Error('Insufficient Credits. Please top up your wavalidator account.');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const checkApiKey = async (apiKey) => {
  try {
    // Attempt a dummy validation request
    // Since phone number '1' is invalid format, the server will either reject the key (401),
    // reject the credits (402), reject the number (400), or succeed (200).
    const response = await fetch('/api/v1/validate/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: '1' })
    });

    if (response.status === 401) {
      return false; // Invalid key format/revoked
    }

    // A 402 or 400 or 200 proves the key is valid (even if credits are out or number is bad)
    return true; 
  } catch (error) {
    // Network errors, cors issue, timeouts
    throw new Error('Failed to connect to validation server');
  }
};
