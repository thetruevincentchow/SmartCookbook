import React, { Component } from 'react';
import {
  AppRegistry,
  Alert,
  StyleSheet, Text, View, Image,
  ScrollView,
  FlatList, SectionList,
  AsyncStorage,
  BackHandler
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  Divider,
  Input, Button
} from 'react-native-elements';
import { HeaderBackButton } from 'react-navigation';
import axios from 'axios';
import {_storeAuth, _retrieveAuth, _revokeAuth, authState} from './AuthManager';
import {ToastAndroid} from 'react-native';

export class RegisterView extends Component {
  static navigationOptions = ({navigation}) => {return {
    title: "Register"
  }};
  
  constructor(props){
    super(props);
  }
  componentDidMount() {
    //this.fetchComments();
  }

  onBackButtonPressAndroid = () => {
    const navigation = this.props.navigation;
    const params = navigation.state.params;
    navigation.pop(params.goBackCount);
    return true;
  };
  
  state = {
    username: "",
    password: "",
    registerErrorMessage: null
  }

  submitRegister(username, password) {
    const x=this;
    axios.post(`http://localhost:3001/user/register`, {
      username: username,
      password: password
    })/*.then((res)=>{ //let's not combine register and login yet
      const {auth_token, username} = res.data;
      const auth = {auth_token:auth_token, username:username};
      x.setState((state,props) => {return {...state, registerErrorMessage: ""}});
      //x.setState((state,props) => {return {...state, registerErrorMessage: JSON.stringify(auth)}});
      alert(JSON.stringify(auth));
      return auth;
    }).then(_storeAuth)*/
    .then(()=>{
      ToastAndroid.show('Registration successful', ToastAndroid.SHORT);
      const {goBack}=x.props.navigation;
      goBack();
    })
    .catch((err)=>{
      //console.error(err);
      const res=err.response;
      if(res===undefined){
        console.error(res);
      }
      
      x.setState((state,props) => {return {...state, registerErrorMessage: err.response.data}});
    });
  }

  render() {
    const {navigate}=this.props.navigation;
    
    return (
      <View style={styles.container}>
        <Input placeholder="Username"
          value={this.state.username}
          onChangeText={(text) => this.setState({username: text})}
          leftIcon={<Icon name='user' size={24} color='black' />}
        />
        <Input placeholder="Password"
          value={this.state.password}
          onChangeText={(text) => this.setState({password: text})}
          secureTextEntry={true}
          leftIcon={<Icon name='lock' size={24} color='black' />}
        />
        <View style={{paddingTop:10, width:200}}>
          <Button
            onPress={() => this.submitRegister(this.state.username, this.state.password)}
            title="Register"
            color="#841584"
            type="outline"
          />
        </View>
        <Text style={styles.error}>{this.state.registerErrorMessage}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    marginLeft:10,
    marginRight:10,
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



