/**
 * Fetch optimization advisory for a junction.
 * 
 * @param {string} junctionId - The ID of the junction
 * @param {Object} payload - Context for optimization (e.g. current traffic)
 * @returns {Promise<Object>} Backend advisory data
 */
export async function getOptimizationPreview(junctionId, payload = {}) {
  try {
    const response = await fetch(`http://localhost:8000/optimize/${junctionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        // We throw to handle "Unavailable" state in UI
        throw new Error(`Optimization API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Optimization Fetch Failed:", error);
    throw error;
  }
}
