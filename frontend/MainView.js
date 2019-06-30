import React, { Component } from 'react';
import {
  StyleSheet, Text, View,
  ImageBackground,
  TouchableNativeFeedback
} from 'react-native';
import {_storeAuth, _retrieveAuth, _revokeAuth, authState} from './AuthManager';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';

export class MainView extends Component {
  static navigationOptions = {
    title: "Smart Cookbook",
  };

  componentDidMount() {
    this.retrieveAuth();
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

  retrieveAuth() {
    _retrieveAuth().then(()=>{
      this.forceUpdate()
    });
  }

  render() {
    const {navigate} = this.props.navigation;
    
    return <View style={styles.container}>
        <TouchableNativeFeedback onPress={() => navigate('InventoryView')}>
          <View>
            <ImageBackground source={require('./assets/background1.jpg')}
              style={styles.item}>
              <Text style={styles.itemText}> Inventory </Text>
            </ImageBackground>
          </View>
        </TouchableNativeFeedback>
        <TouchableNativeFeedback onPress={() => navigate('RecipeSearch')}>
          <View>
            <ImageBackground source={require('./assets/background2.jpg')}
              style={styles.item}>
              <Text style={styles.itemText}> Recipes </Text>
            </ImageBackground>
          </View>
        </TouchableNativeFeedback>
        <TouchableNativeFeedback onPress={() => navigate('AccountView')}>
          <View>
            <ImageBackground source={require('./assets/background3.png')}
              style={styles.item}>
              <Text style={styles.itemText}> Account </Text>
              <Text style={styles.subtitle}> {authState.loaded
                ? (authState.username !== null
                  ? `Signed in as ${authState.username}`
                  : "Sign in or register")
                : "Retrieving account info"} </Text>
            </ImageBackground>
          </View>
        </TouchableNativeFeedback>
      </View>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    flex: 1,
  },
  item: {
    width:null,
    height:150,
    opacity: 0.5,
  },
  itemText: {
    fontSize: 40,
    textAlign: 'left',
    color: '#000',
    opacity: 1,
    margin: 10,
  },
  subtitle: {
    color: 'black',
    fontSize: 20,
    marginHorizontal: 10,
    marginBottom: 5,
  }
});

