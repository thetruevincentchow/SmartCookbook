import React, { Component } from 'react';
import {
  StyleSheet, Text, View, Image, Button,
  ScrollView,
} from 'react-native';
import {
  Divider
} from 'react-native-elements';
import {CommentView, VoteView} from './CommentView';
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

export class RecipeView extends Component {
  static navigationOptions = {
    title: "View recipe"
  };
  
  componentDidMount() {
    this.fetchRecipe();
  }

  state = {
    recipe: null
  };
  
  fetchRecipe() {
    const R = this.props.navigation;
    const id = R.getParam('id');
    const x=this;
    fetch(`http://localhost:3001/recipe/${id}`).then((res)=>res.json())
    .then((res)=>{
      console.log(res);
      x.setState((state,props) => {return {...state, recipe: res}});
    })
    .catch((err)=>{
      console.error(err);
    });
  }
  
  getAvailableQuantity(id){
    const u=inventoryState.ingredientQuantities.get(id);
    if (u===undefined || u===null){
      return {unit:"", amount:0};
    } else if(typeof u === 'number') {
      return {unit:"", amount:u}
    } else {
      return u;
    }
  }

  hasSufficientIngredient(ingredient){
    const id = ingredientIds.get(ingredient.name.trim());
    const availableQuantity = this.getAvailableQuantity(id);

    //convert to recipe's units
    const availableAmount = unitConvert(availableQuantity.amount, availableQuantity.unit, ingredient.unit);
    if(availableAmount >= numericQuantity(ingredient.amount)) {
      return "";
    }else if(availableAmount < 1e-7){
      return "You don't have any";
    }else{
      return `You only have ${availableAmount.toPrecision(3)} ${ingredient.unit}`;
    }
  }

  render() {
    const R = this.props.navigation;
    const id = R.getParam('id');
    const name = R.getParam('name');
    
    const data = this.state.recipe;

    if(!data){
      return (<View style={styles.containe}>
        <Text style={styles.title}>Loading...</Text>
        <Text style={styles.title}>{name}</Text>
      </View>);
    }
    
    const author = data.author;
    const ingredients = data.ingredients;
    const steps = data.instructions;
    
    if(!ingredients){
      return (<View style={styles.containe}>
        <Text style={styles.title}>data</Text>
      </View>);
    }
    
    return (
      <View style={styles.container}>
        <ScrollView stickyHeaderIndices={[1]}>
          <View style={styles.heading}>
            {data.imageURL ? (<Image style={{width: null, resizeMode: 'contain', height:180}}
              source={{uri: data.imageURL}} 
              onError={() => {this.setState({visible:false})}} />) : null}
          </View>
          <View style={styles.heading}>
            <Text style={styles.title}>{name}</Text>
          </View>
          <View style={styles.heading}>
            <Text style={{textAlign:'center', fontSize:20}}>By {author}</Text>
          </View>
          
          <ScrollView stickyHeaderIndices={[1,4]}
            showsVerticalScrollIndicator={false}>
            <View>
              <Text style={styles.subtitle}>Ingredients</Text>
            </View>
            <View>
              {ingredients.map((x, index) =>
                <View key={index}>
                  <View style={{paddingTop:5, paddingBottom:5, flexDirection: 'row'}}>
                    <Text style={{...styles.instructions, width:30}}> {index+1} </Text>
                    <Text style={{fontSize:20, flex:1, flexGrow:1}}>
                      {x.amount!==undefined && x.unit!==undefined
                        ?`${x.amount} ${x.unit} ${x.name}`
                        :`${x.quantity} ${x.name}`
                      }
                    </Text>
                    <Text style={styles.instructions}> {x.type===undefined ? '' : `${x.type}`} </Text>
                  </View>
                  <Text style={styles.error}>{this.hasSufficientIngredient(x)}</Text>
                </View>
              )}
            </View>
            
            <Divider style={{backgroundColor:'black', marginTop:5, marginBottom:5}}/>
            <View>
              <Text style={styles.subtitle}>Recipe</Text>
            </View>
            <View>
              {steps.map((x, index) =>
                <View key={index} style={{paddingTop:5, paddingBottom:5, flexDirection: 'row'}}>
                  <Text style={styles.instructions}> {index+1} </Text>
                  <Text style={{fontSize:20, flex:1, flexGrow:1, marginRight:5}}> {x} </Text>
                </View>
              )}
            </View>
          </ScrollView>
          <CommentView navigation={this.props.navigation} recipeId={id}/>
        </ScrollView>
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
  error: {
    fontSize:14,
    color:'red',
    textAlign:'center'
  },
  heading: {
    backgroundColor: 'white',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  title: {
    textAlign: 'center',
    color: '#333333',
    fontSize: 30,
    marginTop: 5,
    marginBottom: 5,
  },
  subtitle: {
    textAlign: 'center',
    color: '#333333',
    fontSize: 25,
    marginBottom: 5,
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

