// Convert all numeric string values to numbers in an object
export default function numericValuesToNumbers(parameters) {
  return Object.fromEntries(Object.entries(parameters).map(([key, value]) =>
    [key, typeof value === 'string' && value !== '' && !isNaN(value) ? +value : value]
  ));
}