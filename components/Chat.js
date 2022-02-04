import React from 'react';
import { View, Text } from 'react-native';

export default class Chat extends React.Component {
  render() {
    //entered name state from Start screen gets displayed in status bar at the top of the app
    let name = this.props.route.params.name;
    this.props.navigation.setOptions({ title: name});

    const { bgColor } = this.props.route.params;

    return (
      <View style={{
        flex: 1, 
        justifyContent: 'flex-start', 
        alignItems: 'center',
        backgroundColor: bgColor
        }}>
        <Text style={{
          fontSize: 30,
          color: '#555555',
          backgroundColor: '#FFFFFF',
          fontWeight: "400",
          padding: 20,
          borderRadius: 40,
          margin: 50,
        }}>Hello {name}, Welcome to Chatting!</Text>
      </View>
    )
  }
}