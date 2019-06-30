import React, { Component } from 'react';
import { Picker } from 'react-native';

export class UnitPicker extends Component {
  state={
    unit: ''
  };
  
  render(){
    return <Picker style={this.props.style}
        selectedValue={this.state.unit}
        style={{height: 50, width: 100}}
        onValueChange={(itemValue, itemIndex) => {
          this.setState({unit: itemValue});
          this.props.onValueChange ? this.props.onValueChange(itemValue) : null;
        }}>
        <Picker.Item label="no unit" value="" />
        <Picker.Item label="cup" value="cup" />
        <Picker.Item label="teaspoon" value="tsp" />
        <Picker.Item label="tablespoon" value="tbsp" />
        <Picker.Item label="quart" value="quart" />
        <Picker.Item label="g" value="g" />
      </Picker>;
  }
}
