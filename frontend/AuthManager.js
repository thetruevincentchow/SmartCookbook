import {
  AsyncStorage
} from 'react-native';


const authState={loaded:false, auth_token:undefined, username:undefined};

const _updateAuth = (loaded, auth_token, username) => {
  authState.loaded = true;
  authState.auth_token = auth_token;
  authState.username = username;
};

const _storeAuth = async (auth) => {
  try{
    _updateAuth(true, auth.auth_token, auth.username);
    
    await AsyncStorage.multiSet([
      ['auth_token', auth.auth_token],
      ['username', auth.username]
    ]);
  }catch (err){
    console.error(err);
  }
};

const _retrieveAuth = async () => {
  try {
    const value = await AsyncStorage.multiGet(["auth_token", "username"]);
    if (value !== null && value[0][1] !== '') {
      const auth = {auth_token:value[0][1], username:value[1][1]};
      
      _updateAuth(true, auth.auth_token, auth.username);
      return auth;
    } else {
      _updateAuth(true, null, null);
    
      return null;
    }
  } catch (error) {
    console.error(error);
    _updateAuth(false, undefined, undefined);
  
    return null;
  }
};

const _revokeAuth = async () => {
  try{
    await AsyncStorage.multiSet([
      ['auth_token', ""],
      ['username', ""]
    ]);
    
    _updateAuth(true, null, null);
  }catch (err){
    console.error(err);
  }
};

export {_storeAuth, _retrieveAuth, _revokeAuth, authState};
