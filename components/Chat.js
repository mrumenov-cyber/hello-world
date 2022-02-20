import React from 'react';
import { View, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, SystemMessage } from 'react-native-gifted-chat';
// import AsynceStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
// import NetInfo
import NetInfo from '@react-native-community/netinfo';
import CustomActions from './CustomActions';
import MapView from 'react-native-maps';


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
        },
        isConnected:false,
        image: null,
        location: null,
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
        this.refMsgsUser = null;
}


  componentDidMount() {
     // Set the page title once Chat is loaded
     let { name } = this.props.route.params;
     // Adds the name to top of screen
     this.props.navigation.setOptions({ title: name })
     

     //To find out user's connection status
     NetInfo.fetch().then(connection => {
      //actions when user is online
      if (connection.isConnected) {
          this.setState({ isConnected: true });
          console.log('online');
        // listens for updates in the collection
          this.unsubscribe = this.referenceChatMessages
          .orderBy('createdAt', 'desc')
          .onSnapshot(this.onCollectionUpdate);

      
      // user can sign in anonymously -> listen to authentication events
      this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
          if (!user) {
              await firebase.auth().signInAnonymously();
          }
          //update user state with currently active user data
          this.setState({
              uid: user.uid,
              messages: [],
              user: {
                  _id: user.uid,
                  name: name,
                  avatar: "https://placeimg.com/140/140/any",
              },
          });

          //referencing messages of current user
          this.refMsgsUser = firebase
              .firestore()
              .collection("messages")
              .where("uid", "==", this.state.uid);
              });
         

      } else {
          this.setState({ isConnected: false });
          console.log('offline');
          //retrieve chat from asyncstorage
          this.getMessages();
      }   
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
        text: data.text || '',
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar
        },
        image: data.image || null,
        location: data.location || null,
      });
    });
    this.setState({
      messages : messages,
    });
    this.saveMessages();
  };



  //adding new message to database collection
  addMessage() {
    const message = this.state.messages[0];
    // add a new messages to the collection
    this.referenceChatMessages.add({
      _id: message._id,
      text: message.text || '',
      createdAt: message.createdAt,
      user: this.state.user,
      image: message.image || '',
      location: message.location || null,
    });
  }

  async getMessages() {
    let messages = '';
    try {
      messages = await AsyncStorage.getItem('messages') || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  async saveMessages() {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
    } catch (error) {
      console.log(error.message);
    }
  }

  async deleteMessages() {
    try {
      await AsyncStorage.removeItem('messages');
      this.setState({
        messages: []
      })
    } catch (error) {
      console.log(error.message);
    }
  }


  //when user sends a message; addMessage() gets called to add message to the collection
  onSend(messages = []) {
    this.setState((previousState) => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }), () => {
      this.addMessage();
      this.saveMessages();
    })
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
  
//renderBubble function defines style of user messages
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
          }
        }}
      />
    )
  }

  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
      return(
        <InputToolbar
        {...props}
        />
      );
    }
  }

  renderCustomActions = props => {
		return <CustomActions {...props} />;
	};

  //return a MapView when surrentMessage contains location data//5.5
  renderCustomView(props) {
    const { currentMessage } = props;
    if (currentMessage.location) {
        return (
            <MapView
                style={{
                    width: 150,
                    height: 100,
                    borderRadius: 13,
                    margin: 3
                }}
                region={{
                    latitude: currentMessage.location.latitude,
                    longitude: currentMessage.location.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            />
        );
    }
    return null;
}

  //dont receive updates from collection
  componentWillUnmount() {
    // close connections when we close the app
    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
    //stop listening to authentication
    this.authUnsubscribe();
    //stop listening for changes
    this.unsubscribe();
      }
    });
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
          <Text style={{
          fontSize: 14,
          color: '#555555',
          backgroundColor: '#FFFFFF',
          fontWeight: "400",
          padding: 10, 
          borderRadius: 50,
          margin: 15,
          alignSelf: 'center',
        }}>Hello {name}</Text>
          <GiftedChat
            messages={this.state.messages}
            onSend={messages => this.onSend(messages)}
            renderBubble={this.renderBubble.bind(this)}
            renderInputToolbar={this.renderInputToolbar.bind(this)}
            renderSystemMessage={this.renderSystemMessage.bind(this)}
            renderActions={this.renderCustomActions}
            renderCustomView={this.renderCustomView}
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


