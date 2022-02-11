import React from 'react';
import { View, Text, Platform, KeyboardAvoidingView, FlatList } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';

//importing firestore
const firebase = require('firebase');
require('firebase/firestore');


export default class Chat extends React.Component {
  constructor(){
    super();
    this.state = {
      messages: [],
      uid: 0,
      user:{
        _id: "",
        name: "",
        avatar: "",
      }
    }
  

    const firebaseConfig = {
      apiKey: "AIzaSyDmH3vo0j2EmqzCEX5XEyXm__fujhXZoac",
      authDomain: "chatapp-dd30d.firebaseapp.com",
      projectId: "chatapp-dd30d",
      storageBucket: "chatapp-dd30d.appspot.com",
      messagingSenderId: "793384653961",
      appId: "1:793384653961:web:f54e9b3329df412859e258"
    }

      //initialize app 
      if (!firebase.apps.length){
        firebase.initializeApp(firebaseConfig);
      }
      //reference firestore database
      this.referenceChatMessages = firebase.firestore().collection('messages');
}


  componentDidMount() {
     // Set the page title once Chat is loaded
     let { name } = this.props.route.params
     // Adds the name to top of screen
     this.props.navigation.setOptions({ title: name })

    this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        firebase.auth().signInAnonymously();
      }
      //update user state with currently active user data
      this.setState({
        uid: user.uid,
        loggedInText: 'Hello '+ name,
        messages: [],
        user: {
          _id: user.uid,
          name: name,
          avatar: "https://placeimg.com/140/140/any"
        }
      });
      this.unsubscribe = this.referenceChatMessages
        .orderBy("createdAt", "desc")
        .onSnapshot(this.onCollectionUpdate);
    });
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar
        }
      });
    });
    this.setState({
      messages : messages,
    });
  };

  //dont receive updates from collection
  componentWillUnmount() {
    this.authUnsubscribe();
    this.unsubscribe();
  }


  //adding new message to database collection
  addMessage() {
    const message = this.state.messages[0];
    
    this.referenceChatMessages.add({
      _id: message._id,
      text: message.text,
      createdAt: message.createdAt,
      user: this.state.user
    });
  }



  onSend(messages = []) {
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }))
  }

  //renderSystemMessage function renders a system message; the text color depends on the set background color
  renderSystemMessage(props) {
    const { bgColor } = this.props.route.params;
    return (
      <SystemMessage
        {...props}
        textStyle= {{color: bgColor === '#B9C6AE' ? '#555555' : '#dddddd'}}
      />
    );
  }
  

  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#000'
          }
        }}
      />
    )
  }

  render() {
    //entered name state from Start screen gets displayed in status bar at the top of the app
    let name = this.props.route.params.name;
  
    //Color of the screen background becomes the one we picked on the start page
    const { bgColor } = this.props.route.params;

    return (
      <View style={{
        flex: 1, 
        backgroundColor: bgColor,
        }}>
          <Text>{this.state.loggedInText}</Text>
          <GiftedChat
            messages={this.state.messages}
            onSend={messages => this.onSend(messages)}
            renderBubble={this.renderBubble.bind(this)}
            renderSystemMessage={this.renderSystemMessage.bind(this)}
            user={{
              _id: this.state.user._id,
              name: this.state.name,
              avatar: this.state.user.avatar
            }}
          />

          { Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null}
      </View>
    )
  }
}


