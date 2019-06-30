import React, { Component } from 'react';
import {
  StyleSheet, Text, View,
  TextInput,
  SectionList,
  TouchableNativeFeedback,
  ActivityIndicator,
  Picker
} from 'react-native';
import {
  Overlay,
  Button,
  Slider,
  SearchBar,
  CheckBox
} from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import {_storeInventory, _retrieveInventory, inventoryState} from './InventoryManager';
import { unitConvert } from './unit_conversion';

function getIngredients(){
  return require("./assets/ingredients.json");
}

function getIngredientsByType(ingredients) {
  let grouper = {};
  let result = [];
  ingredients.forEach((x) => {
    let u = grouper[x.type];
    if(u===undefined){
      u = {title: x.type, data: []};
      result.push(u);
      grouper[x.type] = u;
    }
    u.data.push(x);
  });
  return result;
}

export class InventoryView extends Component {
  static navigationOptions = ({navigation}) => (
    navigation.state.params && navigation.state.params.searchBarActive
    ? {header: null}
    : {
      headerRight: (
        <View style={{marginRight:10}}>
          <Button
            onPress={
              navigation.state.params
              ? navigation.state.params.enableSearchBar
              : null
            }
            title="Search"
          />
        </View>
      ),
      title: 'Inventory',
    });

  constructor(){
    super();
    this.changeQuantity = this.changeQuantity.bind(this);
    this.getQuantity = this.getQuantity.bind(this);
    this.updateSearch = this.updateSearch.bind(this);
    this.updateSearchText = this.updateSearchText.bind(this);
    this.toggleDisplayAvailable = this.toggleDisplayAvailable.bind(this);
  }

  state = {
    modalVisible: false,
    amount: 0,
    unit: '',
    ingredients: getIngredients(),
    groupedIngredients: getIngredientsByType(getIngredients()),
    searchBarActive: false ,
    searchResults: [],
    search: '',
    displayAvailable: false,
  };

  storeIngredients = async () => {
    await _storeInventory();
  }

  fetchIngredients = async () => {
    const ingredientQuantities = await _retrieveInventory();
  }
  
  filterResults(searchText, availableOnly, results) {
    let text = searchText.toLowerCase();

    return results.filter((x) => {
      return x.name.toLowerCase().indexOf(text) !== -1 && (!availableOnly || this.getQuantity(x, 0).amount>0);
    });
  }

  enableSearchBar(enabled){
    this.props.navigation.setParams({
      searchBarActive:enabled
    });
    this.state.searchBarActive = enabled;
  }

  setModalVisible(visible) {
    this.setState({modalVisible: visible});
  }

  showIngredientModal(selectedIngredient){
    const u=this.getQuantity(selectedIngredient);
    this.setState({
      selectedIngredient: selectedIngredient,
      amount: u.amount,
      unit: u.unit
    });
    this.setModalVisible(true);
  }

  componentDidMount(){
    this.props.navigation.setParams({
      enableSearchBar: ((enabled) => this.enableSearchBar(enabled))
    });
    this.updateSearch = this.updateSearch.bind(this);
    this.setState({
      searchResults: getIngredientsByType(getIngredients())
    });
    this.fetchIngredients();
  }
  
  componentWillUnmount(){
    this.setModalVisible(false);
  }
  
  updateSearch(s){
    var newState={...this.state, ...s};
    this.setState({
      searchResults: getIngredientsByType(this.filterResults(
        newState.search,
        newState.displayAvailable,
        newState.ingredients))
    });
  }
  
  updateSearchText = (search) => {
    this.setState({
      search: search
    });
    this.updateSearch({search:search});
  }

  changeQuantity(ingredient, amount, unit){
    inventoryState.ingredientQuantities.set(ingredient.id, {unit:unit, amount:amount});
    this.forceUpdate();
    this.storeIngredients();
  }
  
  getQuantity(ingredient){
    const u=inventoryState.ingredientQuantities.get(ingredient.id);
    if (u===undefined || u===null){
      return {unit:"", amount:0};
    } else if(typeof u === 'number') {
      return {unit:"", amount:u}
    } else {
      return u;
    }
  }
  
  getQuantityString(ingredient){
    const u=this.getQuantity(ingredient);
    if(u.unit){
      return `${u.amount} ${u.unit}`;
    }else{
      return `${u.amount}`;
    }
  }

  toggleDisplayAvailable() {
    let displayAvailable = !this.state.displayAvailable;
    this.setState({displayAvailable: displayAvailable});
    this.updateSearch({displayAvailable:displayAvailable});
  }
 
  render() {
    if(!inventoryState.loaded){
      return <ActivityIndicator size="small" color="#00ff00" />
    }
    
    return <View style={styles.container}>
      {
        //https://aboutreact.com/hide-header-on-button-click/
        this.state.searchBarActive ?
        (<SearchBar style={{height:80, fontSize:30, left:10}} placeholder="Search recipe"
          onChangeText={this.updateSearchText} value={this.state.search}
          platform="android"
          onCancel={()=>{
            this.updateSearchText("");
            this.enableSearchBar(false);
          }}
          onClear={()=>{
            this.updateSearchText("");
            this.enableSearchBar(false);
          }}
          onConfirm={()=>{
            
          }}
        />) : null}
      <CheckBox
        title='Display only available'
        checked={this.state.displayAvailable}
        onPress={()=>this.toggleDisplayAvailable()}
      />
      {this.state.modalVisible ?
      <Overlay height={300} isVisible={this.state.modalVisible}
        onRequestClose={() => {
          this.setModalVisible(!this.state.modalVisible);
        }}>
        <View style={{marginTop: 22, flexDirection:'column', flex:1}}>
          <Text style={styles.welcome}>
            {this.state.selectedIngredient.name}
          </Text>
          <View style={{flex:1, flexGrow:1}}>
            <Slider
              value={this.state.amount}
              onValueChange={value => {
                this.setState({amount: value});
              }}
              step={1}
              minimumValue={0} maximumValue={20}
            />
            <Text> Quantity </Text>
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
              <TextInput style={{flex:1, fontSize:30}}
                keyboardType="numeric"
                value={`${this.state.amount}`}
                onChangeText={(value) => {
                  const newVal = Number(value)
                  if(!isNaN(newVal)){
                    this.setState({amount: newVal});
                  }
                }}
              />
              <Picker
                selectedValue={this.state.unit}
                style={{height: 50, width: 100}}
                onValueChange={(itemValue, itemIndex) => {
                  const {unit, amount} = this.state;
                  const newUnit = itemValue;
                  this.setState({unit: newUnit, amount: Number(unitConvert(amount, unit, newUnit).toPrecision(3))});
                }}>
                <Picker.Item label="no unit" value="" />
                <Picker.Item label="cup" value="cup" />
                <Picker.Item label="tsp" value="tsp" />
                <Picker.Item label="tbsp" value="tbsp" />
                <Picker.Item label="quart" value="quart" />
                <Picker.Item label="g" value="g" />
              </Picker>
            </View>
          </View>
          <View style={{flexDirection: 'row'}}>
            <View style={{flex:1}}>
              <Button title=" Cancel"
                type="outline"
                icon={
                  <Icon
                    name="times"
                    size={15}
                    color="#4c6ef5"
                  />
                }
                onPress={() => {
                  this.setModalVisible(!this.state.modalVisible);
                }}/>
            </View>
            <View style={{flex:1}}>
              <Button title=" Change"
                icon={
                  <Icon
                    name="check-circle"
                    size={15}
                    color="white"
                  />
                }
                onPress={() => {
                  this.changeQuantity(this.state.selectedIngredient, this.state.amount, this.state.unit);
                  this.setModalVisible(!this.state.modalVisible);
                }}/>
            </View>
          </View>
        </View>
      </Overlay> : null}
                        
      <View>
        <SectionList
          renderItem={({item, index, section}) => (
            <TouchableNativeFeedback
              onPress={() => this.showIngredientModal(item)}
              background={TouchableNativeFeedback.SelectableBackground()}
              key={index}
            >
              <View key={index} style={{paddingTop:5, paddingBottom:5, flexDirection: 'row'}}>
                <Text style={{...styles.item, flex:1}}>{item.name}</Text>
                <View style={{alignItems:'flex-end'}}>
                  <Text style={styles.item}> {this.getQuantityString(item)} </Text>
                </View>
              </View>
            </TouchableNativeFeedback>
          )}
          renderSectionHeader={({section: {title}}) => (
              <Text style={styles.sectionHeader}>{title}</Text>
          )}
          sections={this.state.searchResults}
          keyExtractor={(item, index) => item + index}
        />
      </View>
    </View>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    flex: 1,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  item: {
    padding: 10,
    fontSize: 18,
  },
  sectionHeader: {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'rgba(247,247,247,1.0)',
  },
});


