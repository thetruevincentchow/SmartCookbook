import React, { Component } from 'react';
import {
  StyleSheet, Text, View,
  BackHandler
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  Input, Button
} from 'react-native-elements';
import { HeaderBackButton } from 'react-navigation';
import axios from 'axios';
import {_storeAuth, _retrieveAuth, _revokeAuth, authState} from './AuthManager';
import {ToastAndroid} from 'react-native';

export class LoginView extends Component {
  static navigationOptions = ({navigation}) => {return {
    title: "Log in",
    headerLeft:(
      <HeaderBackButton onPress={()=>{
        const params=navigation.state.params;
        navigation.pop(params.goBackCount);
      }
    }/>)
  }};
  
  constructor(props){
    super(props);
    this._didFocusSubscription = props.navigation.addListener('didFocus', payload =>
      BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPressAndroid)
    );
  }
  componentDidMount() {
    this._willBlurSubscription = this.props.navigation.addListener('willBlur', payload =>
      BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPressAndroid)
    );
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
    loginErrorMessage: null
  }

  submitLogin(username, password) {
    const x=this;
    axios.post(`http://localhost:3001/user/login`, {
      username: username,
      password: password
    }).then((res)=>{
      const {auth_token, username} = res.data;
      const auth = {auth_token:auth_token, username:username};
      x.setState((state,props) => {return {...state, loginErrorMessage: ""}});
      return auth;
    }).then(_storeAuth)
    .then(()=>{
      ToastAndroid.show('Login successful', ToastAndroid.SHORT);
      const {goBack}=x.props.navigation;
      goBack();
    })
    .catch((err)=>{
      const res=err.response;
      if(res===undefined){
        console.error(res);
      }
      
      x.setState((state,props) => {return {...state, loginErrorMessage: err.response.data}}); //show error message
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
            onPress={() => this.submitLogin(this.state.username, this.state.password)}
            title="Submit"
            color="#841584"
            type="outline"
          />
          <Button
            onPress={() => navigate('RegisterView')}
            title="Don't have an account?"
            color="#841584"
            type="outline"
          />
        </View>
        <Text style={styles.error}>{this.state.loginErrorMessage}</Text>
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


