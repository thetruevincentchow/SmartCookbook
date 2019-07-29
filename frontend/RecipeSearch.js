import React, { Component } from 'react';
import {
  StyleSheet, Text, View, Button,
  FlatList,
  TouchableOpacity, TouchableNativeFeedback,
  RefreshControl,
} from 'react-native';
import { SearchBar, Icon, CheckBox } from 'react-native-elements';
import * as axios from 'axios';
import {_storeAuth, _retrieveAuth, _revokeAuth, authState} from './AuthManager';
import {_storeInventory, _retrieveInventory, inventoryState} from './InventoryManager';
import { unitConvert } from './unit_conversion';
const numericQuantity = require("numeric-quantity");

function getIngredients(){
  return require("./assets/ingredients.json");
}
const ingredientIds = new Map();
for(var i of getIngredients()){
  ingredientIds.set(i.name.trim(), i.id);
}
      

export class RecipeSearch extends Component {
  promiseState = async (state) =>
      new Promise(resolve => this.setState(state, resolve));
  
  constructor() {
    super();
    this.updateSearch = this.updateSearch.bind(this);
    this.updateSearchText = this.updateSearchText.bind(this);
  }

  //https://github.com/react-navigation/react-navigation/issues/1534#issuecomment-315977473
  static navigationOptions = ({navigation}) => (navigation.state.params && navigation.state.params.searchBarActive ?
    {header: null} : 
  {
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
    title: 'Recipes',
  });

  fetchRecipeList() {
    const x=this;
    return axios.get('http://localhost:3001/recipe/all').then(function(res){
      const recipeList = res.data.map((y) => {return {...y, available:x.checkRecipeIngredients(y)}});
      x.setState((state,props) => {return {...state, recipeList: recipeList}});
      setTimeout(function(){
        x.updateSearch('');
      }, 100);
    }).catch(function(err){
      console.error(err);
    });
  }

  state = {
    recipeList: null,
    searchResults: null,
    search: '',
    availableOnly: false,
    searchBarActive: false,
    refreshing: false,
    ingredientQuantities: new Map()
  };
  
  getAvailableQuantity(id){
    const u=this.state.ingredientQuantities.get(id);
    if (u===undefined || u===null){
      return {unit:"", amount:0};
    } else if(typeof u === 'number') {
      return {unit:"", amount:u}
    } else {
      return u;
    }
  }
  
  checkRecipeIngredients(recipe){
    const x=recipe;
    return x.ingredients.every(
      (ingredient) => {
        const id = ingredientIds.get(ingredient.name.trim());
        const availableQuantity = this.getAvailableQuantity(id);
        return unitConvert(availableQuantity.amount, availableQuantity.unit, ingredient.unit)
          >= numericQuantity(ingredient.amount);
      }
    );
  }
  
  filterResults(searchText, availableOnly, results) {
    let text = searchText.toLowerCase();

    const r=results.filter((x) => {
      return x.name.toLowerCase().indexOf(text) !== -1;
    });


    if(availableOnly){
      return r.filter((x) => this.checkRecipeIngredients(x));
    }else{
      return r;
    }
  }

  enableSearchBar(enabled){
    this.props.navigation.setParams({
      searchBarActive:enabled
    });
    this.state.searchBarActive = enabled;
  }

  componentDidMount() {
    this.props.navigation.setParams({
      enableSearchBar: ((enabled) => this.enableSearchBar(enabled))
    });
    this.updateSearch = this.updateSearch.bind(this);

    this.fetchRecipeList();
    this.fetchAvailableIngredients();
    
    this._didFocusSubscription = this.props.navigation.addListener(
      'didFocus',
      payload => {
        this.forceUpdate();
      }
    )
  }

  componentWillUnmount(){
    this._didFocusSubscription && this._didFocusSubscription.remove();
  }

  updateSearch(s){
    this.setState({...s}, ()=>{
      this.setState({searchResults: this.filterResults(
        this.state.search,
        this.state.availableOnly,
        this.state.recipeList)});
    });
  }

  updateSearchText = (search) => {
    this.updateSearch({search: search});
  };

  fetchAvailableIngredients = async () => {
    const ingredientQuantities = await _retrieveInventory();
    this.setState({ingredientQuantities: ingredientQuantities});
  }
  
  toggleDisplayAvailable() {
    let availableOnly = !this.state.availableOnly;
    this.setState({availableOnly: availableOnly});
    this.updateSearch({availableOnly:availableOnly});
  }
  
  _onRefresh = () => {
    this.setState({refreshing:true});
    this.fetchRecipeList();
    this.fetchAvailableIngredients()
    .then(() => {this.setState({refreshing:false})});
  }

  render() {
    const {navigate} = this.props.navigation;
    
    return (
      <View style={styles.container}>
        {
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
          />) : null
        }
        <CheckBox
          title='Display only available'
          checked={this.state.availableOnly}
          onPress={()=>this.toggleDisplayAvailable()}
        />
        {(this.state.searchResults!==null)?(<Text>{this.state.searchResults.length} results available</Text>):null}
        <FlatList
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{top:30, alignItems:'center', justifyContent:'center'}}>
              <Text style={{fontSize:30}}> No results found :( </Text>
            </View>
          }
          
          data={this.state.searchResults}
          keyExtractor={(item)=>item.id.toString()}
          renderItem={({item}) => {
            return (
              <TouchableNativeFeedback
                onPress={() => {
                  return navigate('RecipeView', {id: item.id, name: item.name});
                }}
                background={TouchableNativeFeedback.SelectableBackground()}
              >
                <View style={item.available ? styles.item : {...styles.item, ...styles.itemUnavailable}}>
                  <Text style={styles.instructions}> {item.votes} </Text>
                  <Text style={{fontSize:20, flex:1, flexGrow:1, marginRight:5}}> {item.name} </Text>
                </View>
              </TouchableNativeFeedback>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh}
            />
          }
        />
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', alignItems: 'flex-end'}}>
          {
            authState.auth_token
          ? (<TouchableOpacity onPress={()=>navigate('RecipeEdit')}>
              <Icon reverse color="blue" type="font-awesome" name="plus" size={20} />
            </TouchableOpacity>)
          : null
          }
        </View>
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    flex: 1,
  },
  itemUnavailable: {
    backgroundColor: '#FFC0CB'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'left',
    color: '#333333',
    fontSize: 20,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
    
    paddingTop:5,
    paddingBottom:5,
    flexDirection: 'row'
  },
  sectionHeader: {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(247,247,247,1.0)',
  },
});

