import { actionCreatorFactory, noPayloadActionCreatorFactory } from 'app/core/redux';
import { ThunkResult, SyncInfo, LdapUser, LdapConnectionInfo, LdapError, UserSession, User } from 'app/types';
import {
  getUserInfo,
  getLdapState,
  syncLdapUser,
  getUser,
  getUserSessions,
  revokeUserSession,
  revokeAllUserSessions,
  getLdapSyncStatus,
} from './apis';

// Action types

export const ldapConnectionInfoLoadedAction = actionCreatorFactory<LdapConnectionInfo>(
  'ldap/CONNECTION_INFO_LOADED'
).create();
export const ldapSyncStatusLoadedAction = actionCreatorFactory<SyncInfo>('ldap/SYNC_STATUS_LOADED').create();
export const userMappingInfoLoadedAction = actionCreatorFactory<LdapUser>('ldap/USER_INFO_LOADED').create();
export const userMappingInfoFailedAction = actionCreatorFactory<LdapError>('ldap/USER_INFO_FAILED').create();
export const clearUserMappingInfoAction = noPayloadActionCreatorFactory('ldap/CLEAR_USER_MAPPING_INFO').create();
export const clearUserErrorAction = noPayloadActionCreatorFactory('ldap/CLEAR_USER_ERROR').create();

export const userLoadedAction = actionCreatorFactory<User>('USER_LOADED').create();
export const userSessionsLoadedAction = actionCreatorFactory<UserSession[]>('USER_SESSIONS_LOADED').create();
export const userSyncFailedAction = noPayloadActionCreatorFactory('USER_SYNC_FAILED').create();
export const revokeUserSessionAction = noPayloadActionCreatorFactory('REVOKE_USER_SESSION').create();
export const revokeAllUserSessionsAction = noPayloadActionCreatorFactory('REVOKE_ALL_USER_SESSIONS').create();

// Actions

export function loadLdapState(): ThunkResult<void> {
  return async dispatch => {
    const connectionInfo = await getLdapState();
    dispatch(ldapConnectionInfoLoadedAction(connectionInfo));
  };
}

export function loadLdapSyncStatus(): ThunkResult<void> {
  return async dispatch => {
    const syncStatus = await getLdapSyncStatus();
    dispatch(ldapSyncStatusLoadedAction(syncStatus));
  };
}

export function loadUserMapping(username: string): ThunkResult<void> {
  return async dispatch => {
    try {
      dispatch(clearUserMappingInfoAction());
      dispatch(clearUserError());
      const userInfo = await getUserInfo(username);
      dispatch(userMappingInfoLoadedAction(userInfo));
    } catch (error) {
      const userError = {
        title: error.data.message,
        body: error.data.error,
      };
      dispatch(userMappingInfoFailedAction(userError));
    }
  };
}

export function clearUserError(): ThunkResult<void> {
  return dispatch => {
    dispatch(clearUserErrorAction());
  };
}

export function clearUserMappingInfo(): ThunkResult<void> {
  return dispatch => {
    dispatch(clearUserErrorAction());
    dispatch(clearUserMappingInfoAction());
  };
}

export function syncUser(userId: number): ThunkResult<void> {
  return async dispatch => {
    try {
      await syncLdapUser(userId);
      dispatch(loadUser(userId));
      dispatch(loadLdapSyncStatus());
    } catch (error) {
      dispatch(userSyncFailedAction());
    }
  };
}

export function loadLdapUserInfo(userId: number): ThunkResult<void> {
  return async dispatch => {
    try {
      dispatch(clearUserError());
      const user = await getUser(userId);
      dispatch(userLoadedAction(user));
      dispatch(loadUserMapping(user.login));
    } catch (error) {
      const userError = {
        title: error.data.message,
        body: error.data.error,
      };
      dispatch(userMappingInfoFailedAction(userError));
    }
  };
}

export function loadUser(userId: number): ThunkResult<void> {
  return async dispatch => {
    try {
      const user = await getUser(userId);
      dispatch(userLoadedAction(user));
      dispatch(loadUserMapping(user.login));
    } catch (error) {
      const userError = {
        title: error.data.message,
        body: error.data.error,
      };
      dispatch(userMappingInfoFailedAction(userError));
    }
  };
}

export function loadUserSessions(userId: number): ThunkResult<void> {
  return async dispatch => {
    const sessions = await getUserSessions(userId);
    dispatch(userSessionsLoadedAction(sessions));
  };
}

export function revokeSession(tokenId: number, userId: number): ThunkResult<void> {
  return async dispatch => {
    await revokeUserSession(tokenId, userId);
    dispatch(loadUserSessions(userId));
  };
}

export function revokeAllSessions(userId: number): ThunkResult<void> {
  return async dispatch => {
    await revokeAllUserSessions(userId);
    dispatch(loadUserSessions(userId));
  };
}
