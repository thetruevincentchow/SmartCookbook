import React, { Component } from 'react';
import {
  AppRegistry,
  View
} from 'react-native';
import { createStackNavigator, createSwitchNavigator, createAppContainer } from 'react-navigation';
import { MainView } from './MainView';
import { RecipeSearch } from './RecipeSearch';
import { RecipeView } from './RecipeView';
import { InventoryView } from './InventoryView';
import { LoginView } from './LoginView';
import { AccountView } from './AccountView';
import { RegisterView } from './RegisterView';
import { RecipeEdit } from './RecipeEdit';
import { MenuProvider } from 'react-native-popup-menu';
import {_storeAuth, _retrieveAuth, _revokeAuth, authState} from './AuthManager';
import {_storeInventory, _retrieveInventory, inventoryState} from './InventoryManager';

const AppStack = createStackNavigator({
  MainView: MainView,
  RecipeSearch: RecipeSearch,
  RecipeView: RecipeView,
  RecipeEdit: RecipeEdit,
  InventoryView: InventoryView,
  
  LoginView: LoginView,
  AccountView: AccountView,
  RegisterView: RegisterView,
});

const AppContainer = createAppContainer(AppStack);

export default class App extends React.Component {
  componentDidMount(){
    _retrieveAuth();
    _retrieveInventory();
  }
  
  render() {
    return (<MenuProvider>
      <AppContainer />
    </MenuProvider>);
  }
}
