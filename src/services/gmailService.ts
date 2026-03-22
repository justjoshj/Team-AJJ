const BASE_URL = 'http://localhost:3000';

export const fetchGmail = async (token: string) => {
  try {
    const response = await fetch(`${BASE_URL}/emails`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch emails');

    const emails = await response.json();
    // This now returns an array of objects with { id, subject, from, snippet }
    return emails; 
  } catch (error) {
    console.error('gmailService Error:', error);
    throw error;
  }
};
