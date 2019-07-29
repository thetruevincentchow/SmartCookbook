//for simplicity, assume interchangable conversion of 1 g to 1 ml
//this might change in the future
const unitScales = {
  "": 50, //nominal mass/volume of 50 g or 50 ml is assumed
  "package": 50, //follows ""
  
  "cup": 284.131, //in ml
  "tsp": 5.91939, //in ml
  "tbsp": 17.7582, //in ml
  "quart": 1136.52, //in ml
  "g": 1, //volume of 1 g water in ml
  "kg": 1000, //volume of 1000 g water in ml
  "ml": 1, //in ml
  "l": 1000, //in ml
  "oz": 28.34952, //volume of 1 oz water in ml
  "fl oz": 28.34952,
  "lb": 453.5924, //volume of 1 lb water in ml
};

export function unitConvert(fromAmount, fromUnit, toUnit){
  return (unitScales[fromUnit] || unitScales[""])/(unitScales[toUnit] || unitScales[""]) * fromAmount;
}
