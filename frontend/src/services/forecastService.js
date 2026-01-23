/**
 * Fetch traffic forecast for a specific junction.
 * 
 * @param {string} junctionId - The ID of the junction (e.g., J001)
 * @param {number} horizonMinutes - Time horizon in minutes (30 or 60)
 * 
 * @returns {Promise<Object>} Backend forecast response
 * @throws {Error} If network error or non-200 response
 */
export async function getTrafficForecast(junctionId, horizonMinutes) {
  try {
    // Note: Backend expects horizon_minutes as a query parameter despite being a POST
    const url = new URL(`http://localhost:8000/forecast/${junctionId}`);
    url.searchParams.append('horizon_minutes', horizonMinutes);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Sending empty body since params are in query, but adhering to POST method
      body: JSON.stringify({}) 
    });

    if (!response.ok) {
      throw new Error(`Forecast API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'SyntaxError') {
       throw new Error("Invalid JSON response from server");
    }
    throw new Error(`Connection failed: ${error.message}`);
  }
}
