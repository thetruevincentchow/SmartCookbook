import {
  AsyncStorage
} from 'react-native';

const inventoryState = {loaded:false, ingredientQuantities:null};

const _updateInventory = (loaded, ingredientQuantities) => {
  inventoryState.loaded = true;
  inventoryState.ingredientQuantities = ingredientQuantities;
};

const _storeInventory = async () => {
  try{
    await AsyncStorage.setItem('inventory',
      JSON.stringify([...inventoryState.ingredientQuantities]));
  }catch (err){
    console.error(err);
  }
}

const _retrieveInventory = async () => {
  try{
    const value = await AsyncStorage.getItem('inventory');
    const ingredientQuantities = new Map(JSON.parse(value));
    _updateInventory(true, ingredientQuantities);
    return ingredientQuantities;
  }catch (err){
    console.error(err);
  }
}
  

export {_storeInventory, _retrieveInventory, inventoryState};
