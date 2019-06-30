import React, { Component } from 'react';
import {
  StyleSheet, Text, View, Button,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import {
  Divider, Icon
} from 'react-native-elements';
import axios from 'axios';
import {_storeAuth, _retrieveAuth, _revokeAuth, authState} from './AuthManager';

class CommentInput extends Component {
  state = {
    commentText: "",
    locked: false
  }

  retrieveAuth() {
    _retrieveAuth().then((res)=>{
      this.forceUpdate();
    });
  }

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

  submitComment() {
    if(this.state.locked){
      return;
    }
    this.setState({locked:true});
    
    const {commentText} = this.state;
    const {recipeId} = this.props;
    const x=this;
    axios.post(`http://localhost:3001/recipe/comment/new`, {
      auth_token: authState.auth_token,
      text: commentText,
      recipe_id: recipeId
    })
    .then(() => {
      this.setState({locked:false, commentText: ""});
    })
    .then(this.props.onSubmitComment)
    .catch((err)=>{
      console.error(err);
    });
  }

  
  render() {
    const {navigate} = this.props.navigation;
    if(!authState.loaded){
      return <ActivityIndicator size="small" color="#00ff00" />
    }else if(authState.auth_token===null){
      return (<View>
        <Button
          onPress={()=>{navigate('LoginView', {goBackCount:1})}}
          title="Sign in to post comments"
          color="#841584"
        />
      </View>)
    }

    return (
      <View>
        <Text style={{fontSize:20, marginLeft: 10, marginRight:5}}> {authState.username} says... </Text>
        <View style={{...styles.input, color:'white', height:60, flex:0, flexDirection: 'row'}}>
          <TextInput placeholder="Type comment here"
            multiline={true}
            style={{fontSize:20, flex:1}}
            value={this.state.commentText}
            onChangeText={(text) => this.setState({commentText: text})}
            editable={!this.state.locked}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.submitComment()}
          >
            {/* Apply inactive style if no input */}
            <Text>{this.state.commentText.length>0 ? "POST": ""}</Text>
          </TouchableOpacity>
        </View>
      </View>)
  }
}

export class VoteView extends Component {
  state = {
    locked: false,
    totalVotes: null,
    selectedVote: null,
    disabled: true
  }

  retrieveAuth() {
    return _retrieveAuth().then((res)=>{
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.retrieveAuth().then(() => this.fetchVotes());
    this._didFocusSubscription = this.props.navigation.addListener(
      'didFocus',
      payload => {
        this.forceUpdate();
        this.fetchVotes();
      }
    )
  }

  componentWillUnmount(){
    this._didFocusSubscription && this._didFocusSubscription.remove();
  }


  fetchVotes() {
    const {recipeId} = this.props;
    if(authState.auth_token!==null){
      axios.post('http://localhost:3001/recipe/vote/current', {
        auth_token: authState.auth_token,
        recipe_id: recipeId
      })
      .then((res) => {
        this.setState({totalVotes:res.data.total, selectedVote:res.data.mag, disabled:false});
      })
      .catch((err) => {
        console.error(err);
      });
    }else{
      axios.get(`http://localhost:3001/recipe/vote/current/${recipeId}`)
      .then((res) => {
        this.setState({totalVotes:res.data.total, selectedVote:null, disabled:false});
      })
      .catch((err) => {
        console.error(err);
      });
    }
  }

  submitVote(mag) {
    if(this.state.locked){
      return;
    }
    this.setState({locked:true});
    
    const {recipeId} = this.props;
    const x=this;
    axios.post(`http://localhost:3001/recipe/vote/update`, {
      auth_token: authState.auth_token,
      recipe_id: recipeId,
      mag: mag
    })
    .then((res) => {
      x.setState({locked:false, totalVotes:res.data.total, selectedVote: mag});
    })
    .catch((err)=>{
      console.error(err);
    });
  }

  
  render() {
    const {navigate} = this.props.navigation;
    
    if(!authState.loaded || this.state.totalVotes===null){
      return <ActivityIndicator size="small" color="#00ff00" />
    }else if(authState.auth_token===null){
      return (<View>
        <Text style={styles.subtitle}> {this.state.totalVotes} votes</Text>
        <Button
          onPress={()=>{navigate('LoginView', {goBackCount:1})}}
          title="Sign in to vote"
          color="#841584"
        />
      </View>)
    }
    
    return (<View>
      <Text style={styles.subtitle}> {this.state.totalVotes} vote{this.state.totalVotes===1?"":"s"}</Text>
      <View style={{alignSelf:'center', alignContent:'center', flexDirection:'row', flexGrow:1}}>
      {/*
        <Button icon={ <Icon name="thumbs-up" size={15} color="white" /> } title="" />
        <Button icon={ <Icon name="creative-commons-zero" size={15} color="white" /> } title="" />
        <Button icon={ <Icon name="thumbs-up" size={15} color="white" /> } title="" />
      */}
        <TouchableOpacity onPress={()=>this.submitVote(1)}>
          <Icon reverse disabled={this.state.disabled} color={this.state.selectedVote===1 ? "red" : "blue"} type="font-awesome" name="thumbs-up" size={20} />
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>this.submitVote(0)}>
          <Icon reverse disabled={this.state.disabled} color={this.state.selectedVote===0 ? "red" : "blue"} type="font-awesome" name="circle" size={20} />
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>this.submitVote(-1)}>
          <Icon reverse disabled={this.state.disabled} color={this.state.selectedVote===-1 ? "red" : "blue"} type="font-awesome" name="thumbs-down" size={20} />
        </TouchableOpacity>
      </View>
    </View>)
  }
}


export class CommentView extends Component {
  static navigationOptions = {
    title: "View recipe"
  };
  
  componentDidMount() {
    this.fetchComments();
  }
  
  state = {
    comments: null,
  }
  
  fetchComments() {
    const id=this.props.recipeId;
    const x=this;
    fetch(`http://localhost:3001/recipe/comments/${id}`).then((res)=>res.json())
    .then((res)=>{
      console.log(res);
      x.setState((state,props) => {return {...state, comments: res}});
    })
    .catch((err)=>{
      console.error(err);
    });
  }

  render() {
    const {navigate} = this.props.navigation;
    const {recipeId} = this.props;
    
    const comments = this.state.comments;
    if(comments===null){
      return (
        <View style={styles.container}>
          <Text style={styles.title}> Loading comments </Text>
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <ScrollView stickyHeaderIndices={[0]}>
          <VoteView recipeId={recipeId} navigation={this.props.navigation}/>
          <View style={styles.heading}>
            <Text style={styles.title}>{comments.length===1 ? "1 Comment" : `${comments.length} Comments`}</Text>
            {comments.length===0 ? (<Text style={styles.subtitle}>Be the first to comment!</Text>): null}
          </View>
          {comments.map((x, index) =>
              <View key={index} style={{paddingTop:5, paddingBottom:5}}>
                <Text style={styles.instructions}> {x.author} </Text>
                <Text style={{fontSize:20, marginLeft: 10, marginRight:5}}> {x.text} </Text>
              </View>
            )}
          <Divider style={{marginTop:20, marginBottom:5}}/>
          <CommentInput recipeId={recipeId} navigation={this.props.navigation} onSubmitComment={()=>this.fetchComments()}/>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    flex: 1,
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
  input: {
    flex: 1,
    fontSize: 15,
  },
  button: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: {
    color: '#CCC'
  },
});

