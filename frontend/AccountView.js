import React, { Component } from 'react';
import {
  Alert,
  StyleSheet, Text, View,
  FlatList,
  ActivityIndicator,
  TextInput, TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  Divider,
  Button,
  ListItem
} from 'react-native-elements';
import axios from 'axios';
import {_storeAuth, _retrieveAuth, _revokeAuth, authState} from './AuthManager';
import {ToastAndroid} from 'react-native';

export class AccountView extends Component {
  static navigationOptions = {
    title: "My Account"
  };

  constructor(){
    super();
  }

  componentDidMount(){
    this.fetchDescription();
    this.fetchRecipes();
    this.retrieveAuth();
    this._didFocusSubscription = this.props.navigation.addListener(
      'didFocus',
      payload => {
        this.retrieveAuth();
        this.forceUpdate();
      }
    )
  }

  state = {
    recipeList: null
  }

  resetAuth(){
    _revokeAuth()
    .then(()=>{
      this.forceUpdate();
    });
  }

  retrieveAuth() {
    _retrieveAuth().then(()=>{
      if(authState.auth_token===null){
        const {navigate} = this.props.navigation;
        navigate('LoginView', {goBackCount:2});
      }else{
        this.fetchDescription();
        this.fetchRecipes();
        this.forceUpdate();
      }
    });
  }

  fetchRecipes(){
    axios.get(`http://localhost:3001/user/${authState.username}/recipes`)
    .then((res)=>{
      const recipeList = res.data;
      this.setState({recipeList: recipeList});
    })
    .catch((err)=>{
      console.error(err);
    });
  }

  fetchDescription(){
    axios.get(`http://localhost:3001/user/${authState.username}/description`)
    .then((res)=>{
      const {description} = res.data;
      this.setState({description: description});
    })
    .catch((err)=>{
      //console.error(err);
    });
  }

  updateDescription(){
    axios.post("http://localhost:3001/user/update/description", {
      auth_token: authState.auth_token,
      description: this.state.description
    })
    .then((res)=>{
      ToastAndroid.show(res.data, ToastAndroid.SHORT);
    })
    .catch((err)=>{
      console.error(err);
    });
  }

  submitLogout(){
    const x=this;
    axios.post(`http://localhost:3001/user/logout`, {
      auth_token: authState.auth_token
    }).then((res)=>{
      this.resetAuth();
    }).then(_revokeAuth)
    .then(() => {
      this.retrieveAuth();
      this.forceUpdate();
    })
    .catch((err)=>{
      this.resetAuth();
      this.forceUpdate();
    });
  }

  deleteRecipe(id){
    const x=this;
    axios.post(`http://localhost:3001/recipe/delete`, {
      auth_token: authState.auth_token,
      id: id
    }).then((res) => {
      ToastAndroid.show(res.data, ToastAndroid.SHORT);
      this.fetchRecipes();
      this.forceUpdate();
    })
    .catch((err)=>{
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this._didFocusSubscription && this._didFocusSubscription.remove();
  }
  
  render() {
    const {navigate} = this.props.navigation;
    
    if(!authState.loaded){
      return <ActivityIndicator />
    }

    if(!authState.auth_token || !authState.username){
      <View style={[styles.container, styles.subtitle]}>
        <Text style={styles.subtitle}>Not logged in</Text>
      </View>
    }
    
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Logged in as {authState.username}</Text>
        <View>
          <TextInput placeholder="Tell us about yourself"
            value={this.state.description}
            onChangeText={(text)=>{ this.setState({description: text}) }}/>
          <Button
            onPress={()=>this.updateDescription()}
            title="Update"
          />
        </View>
        <Divider />
        <Text style={styles.subtitle}>Your recipes</Text>
        {this.state.recipeList === null
          ? (<ActivityIndicator size="small" color="#00ff00" />)
          : (<View style={{flex:1, flexGrow:1, width:'100%'}}>
              <FlatList
                keyExtractor={(item,index) => index.toString()}
                data={this.state.recipeList}
                renderItem={({item}) => {
                  return <ListItem title={item.name} subtitle={`${item.votes} votes`}
                    onPress={() => navigate('RecipeView', {id: item.id, name: item.name})}
                    rightIcon={
                      <TouchableOpacity onPress={()=>{
                          Alert.alert(
                            'Confirm deletion',
                            `Really delete recipe "${item.name}"?`,
                            [
                              {
                                text: 'Cancel',
                                onPress: () => console.log('Cancel Pressed'),
                                style: 'cancel',
                              },
                              {text: 'OK', onPress: ()=>{
                                this.deleteRecipe(item.id);
                              }}
                            ],
                            {cancelable: true},
                          );}
                        }>
                        <Icon type="font-awesome" name="trash" size={20} />
                      </TouchableOpacity>
                    }
                    />
                }}
              />
            </View>)}
        
        <View style={{flex:1, justifyContent:'flex-end', paddingBottom:20}}>
          <Button
            onPress={()=>this.submitLogout()}
            title="Log out"
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    paddingTop:5,
    paddingLeft:10,
    paddingRight:10,
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


