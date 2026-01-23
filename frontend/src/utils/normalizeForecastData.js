/**
 * Normalizes raw traffic forecast data returned by the backend.
 * 
 * @param {Object} rawForecastResponse - The raw forecast response from the backend
 * @returns {Object|null} Standardized forecast object or null if invalid
 */
const normalizeForecastData = (rawForecastResponse) => {
  if (
    !rawForecastResponse || 
    !rawForecastResponse.predictions || 
    !Array.isArray(rawForecastResponse.predictions) ||
    rawForecastResponse.predictions.length === 0
  ) {
    return null;
  }

  return {
    junctionId: rawForecastResponse.junction_id,
    horizonMinutes: rawForecastResponse.horizon_minutes,
    model: rawForecastResponse.model,
    points: rawForecastResponse.predictions.map(pred => ({
      timeOffsetMin: pred.minute,
      pcu: pred.pcu,
      confidence: pred.confidence
    })),
    generatedAt: new Date()
  };
};

export default normalizeForecastData;
