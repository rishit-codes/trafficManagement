/**
 * Check spillback risk for a junction approach.
 * 
 * @param {string} junctionId - The ID of the junction (e.g., J001)
 * @param {Object} payload - Data payload
 * @param {number} payload.queue_length - Current number of vehicles in queue
 * @param {string} payload.approach - Direction (NORTH, SOUTH, EAST, WEST)
 * @param {number} [payload.storage_capacity] - Optional override
 * 
 * @returns {Promise<Object>} Backend response with risk status
 * @throws {Error} If network error or non-200 response
 */
export async function checkSpillback(junctionId, payload) {
  try {
    const response = await fetch(`http://localhost:8000/spillback/${junctionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Spillback API Error: ${response.status} ${response.statusText}`);
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
