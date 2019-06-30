import React, { Component } from 'react';
import {
  StyleSheet, Text, View, Image, Button,
  TextInput,
  ScrollView,
  TouchableOpacity, TouchableHighlight,
  KeyboardAvoidingView
} from 'react-native';
import {
  Divider,
  Icon
} from 'react-native-elements';
import { UnitPicker } from './UnitPicker';
import * as axios from 'axios';
import {_storeAuth, _retrieveAuth, _revokeAuth, authState} from './AuthManager';

export class RecipeEdit extends Component {
  static navigationOptions = {
    title: "Edit recipe"
  };
  
  componentDidMount() {
    //this.fetchRecipe();
  }

  state = {
    name: '',
    recipe: {
      ingredients: [],
      instructions: []
    }
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
  
  submitRecipe() {
    const R = this.props.navigation;
    const id = R.getParam('id');
    const x=this;
    axios.post('http://localhost:3001/recipe/new', {
      auth_token: authState.auth_token,
      name: this.state.name,
      ...this.state.recipe, //ingredients, instructions
    })
    .then((res)=>{
      console.log(res);
      x.setState((state,props) => {return {...state, recipe: res}});
    })
    .then(()=>{
      R.goBack();
    })
    .catch((err)=>{
      console.error(err);
    });
  }

  addIngredient(){
    this.state.recipe.ingredients.push({
      amount: '',
      unit: '',
      name: '',
      type: undefined
    });
    this.forceUpdate();
  }
  
  addStep(){
    this.state.recipe.instructions.push('');
    this.forceUpdate();
  }

  removeIngredient(index){
    const {ingredients} = this.state.recipe;
    if(0<=index && index<ingredients.length){
      //TODO: fix, splice behaves incorrectly
      ingredients.splice(index, 1);
      this.forceUpdate();
    }
  }

  removeStep(index){
    const {instructions} = this.state.recipe;
    if(0<=index && index<instructions.length){
      //TODO: fix, splice behaves incorrectly
      instructions.splice(index, 1);
      this.forceUpdate();
    }
  }
  
  render() {
    const R = this.props.navigation;
    const id = R.getParam('id');
    const name = R.getParam('name');
    
    const data = this.state.recipe;
    
    const ingredients = data.ingredients;
    const steps = data.instructions;
    
    if(!ingredients){
      return (<View style={styles.containe}>
        <Text style={styles.title}>data</Text>
      </View>);
    }
    
    return (
      <View style={{flex:1}}>
        <KeyboardAvoidingView style={{...styles.container, flex: 1, flexDirection:'column'}}
          behavior={"padding"} enabled keyboardVerticalOffset={-100}>
          <ScrollView>
            {/*
            <View style={styles.heading}>
              <Image style={{width: null, resizeMode: 'contain', height:180}}
                source={{uri: data.imageURL}} 
                onError={() => {this.setState({visible:false})}} />
            </View>
            */}
            <View style={styles.heading}>
              <TextInput placeholder="Recipe name here" value={this.state.name} style={styles.title} onChangeText={(text)=>this.setState({name:text})}/>
            </View>
          

            <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center', alignContent:'center'}}>
              <Text style={styles.subtitle}>Ingredients</Text>
              <View style={{paddingLeft:15}}>
                <TouchableOpacity hitSlop={{top: 10, bottom: 10, left: 0, right: 0}} onPress={()=>this.addIngredient()}>
                  <Icon color="blue" type="font-awesome" name="plus" size={25} />
                </TouchableOpacity>
              </View>
            </View>
            <View>
              {ingredients.map((x, index) =>
                <View key={index} style={{paddingTop:5, paddingBottom:5, flexDirection: 'row'}}>
                  <TouchableHighlight hitSlop={{top: 10, bottom: 10, left: 0, right: 0}} onPress={()=>this.removeIngredient(index)}>
                    <Text style={{...styles.instructions, width:30}}> {index+1} </Text>
                  </TouchableHighlight>
                  <TextInput placeholder='Qty' style={{fontSize:20, flex:0.5}} onChangeText={(text)=>{x.amount=text;}}/>
                  <UnitPicker style={{flex:1}} onValueChange={(unit) => {x.unit=unit;}}/>
                  <TextInput placeholder='Name' autoCapitalize="none" style={{fontSize:20, flex:2, flexGrow:1}} onChangeText={(text)=>{x.name=text;}}/>
                </View>
              )}
            </View>
            
            <Divider style={{backgroundColor:'black', marginTop:5, marginBottom:5}}/>
            <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center', alignContent:'center'}}>
              <Text style={styles.subtitle}>Recipe</Text>
              <View style={{paddingLeft:15}}>
                <TouchableOpacity hitSlop={{top: 10, bottom: 10, left: 0, right: 0}} onPress={()=>this.addStep()}>
                  <Icon color="blue" type="font-awesome" name="plus" size={25} />
                </TouchableOpacity>
              </View>
            </View>
            <View>
              {steps.map((x, index) =>
                <View key={index} style={{paddingTop:5, paddingBottom:5, flexDirection: 'row'}}>
                  <TouchableHighlight hitSlop={{top: 10, bottom: 10, left: 0, right: 0}} onPress={()=>this.removeStep(index)}>
                    <Text style={styles.instructions}> {index+1} </Text>
                  </TouchableHighlight>
                  <TextInput style={{fontSize:20, flex:1, flexGrow:1, marginRight:5}}
                    onChangeText={(text)=>{this.state.recipe.instructions[index]=text}}> {x} </TextInput>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        <View style={{flexDirection: 'row'}}>
          <View style={{flex:1}}>
            <Button title=" Cancel"
              type="outline"
              icon={ <Icon name="times" type="font-awesome" size={15} color="#4c6ef5" /> }
              onPress={() => { R.goBack(); }}/>
          </View>
          <View style={{flex:1}}>
            <Button title=" Submit"
              icon={ <Icon name="check-circle" type="font-awesome" size={15} color="white" /> }
              onPress={() => { this.submitRecipe(); }}/>
          </View>
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

