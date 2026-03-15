export const validatePhoneNumber = async (apiKey, phoneNumber) => {
  try {
    const response = await fetch('https://wavalidator.com/api/v1/validate/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: phoneNumber })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API Key or Insufficient Credits');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
