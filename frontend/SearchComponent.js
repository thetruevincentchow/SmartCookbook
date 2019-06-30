import React, { Component } from 'react';
import {
  StyleSheet, Text, View, Button,
} from 'react-native';
import { SearchBar } from 'react-native-elements';

export class SearchComponent extends Component {
  constructor() {
    super();
    this.updateSearch = this.updateSearch.bind(this);
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

  state = {
    searchResults: recipeList,
    search: '',
    searchBarActive: false 
  };
  
  filterResults(searchText, results) {
    let text = searchText.toLowerCase();

    return results.filter((x) => {
      return x.name.toLowerCase().indexOf(text) !== -1;
    });
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
  }
  
  updateSearch = (search) => {
    this.setState({
      search: search
    });
    this.setState({
      searchResults: this.filterResults(search, recipeList)
    });
  }

  render() {
    const {navigate} = this.props.navigation;
    
    return (
      <View style={styles.container}>
        {
          this.state.searchBarActive ?
          (<SearchBar style={{height:80, fontSize:30, left:10}} placeholder="Search recipe"
            onChangeText={this.updateSearch} value={this.state.search}
            platform="android"
            onCancel={()=>{
              this.updateSearch("");
              this.enableSearchBar(false);
            }}
            onClear={()=>{
              this.updateSearch("");
              this.enableSearchBar(false);
            }}
            onConfirm={()=>{
              
            }}
          />) : null
        }
      </View>
    );
  }
}
