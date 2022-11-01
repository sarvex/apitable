import { Api } from 'api';
import { ISignIn } from '../../modules/shared/api.interface';
import { Dispatch } from 'redux';
import { setActiveSpaceId } from 'store/actions/space';
import { BindAccount, QrAction } from 'store/constants';
import { ConfigConstant } from '../../config';
import * as actions from '../action_constants';
import { IHttpErr, ILocateIdMap, IReduxState, IUserInfo } from '../interface';

/**
 * login
 * @param username 
 * @param password 
 */

export const signIn = (data: ISignIn) => {
  return (dispatch: Dispatch) => {
    Api.signIn(data).then(res => {
      const { success, message, code } = res.data;
      if (success) {
        dispatch(getUserMe() as any);
        dispatch(setHomeErr(null));
        dispatch(setHttpErrInfo(null));
      } else {
        dispatch(setHomeErr({
          code,
          msg: message,
        }));
      }
    });
  };
};

/**
 * get verify code in register
 * @param phone 
 */
export const getRegisterCode = (areaCode: string, phone: string) => {
  return (dispatch: Dispatch) => {
    Api.getSmsCode(areaCode, phone, ConfigConstant.REGISTER_ACCOUNT).then(res => {
      const { code, message } = res.data;
      dispatch(setHomeErr({
        code,
        msg: message,
      }));
    });
  };
};

/**
 * miniapp qr code poll query
 * @param {(0 | 1 | 2)} type
 * 0：web qrcode login
 * 1：web account binding
 * 2：miniap is waiting to enter workbench
 * @param {string} mark  QRCode ID
 * @returns
 */
export const poll = (type: QrAction, mark: string) => {
  return (dispatch: Dispatch) => {
    Api.poll(type, mark).then(res => {
      const { success } = res.data;
      if (success) {
        dispatch(getUserMe() as any);
      }
    });
  };
};

/**
 * get current state of getting verify code
 * @param status current state
 */
export const setIsCode = (status: boolean) => {
  return {
    type: actions.SET_IS_CODE,
    payload: status,
  };
};

/**
 * set current register state
 * @param status 
 */
export const setRegisterStatus = (status: boolean) => {
  return {
    type: actions.SET_REGISTER_STATUS,
    payload: status,
  };
};

/**
 * set state of whether used invite award
 * @param status new state
 */
export const setUsedInviteReward = (status: boolean) => {
  return {
    type: actions.SET_USED_INVITE_REWARD,
    payload: status,
  };
};

/**
 * set error message on login
 * @param err 
 */
export const setHomeErr = (err: IHttpErr | null) => {
  return {
    type: actions.SET_HOME_ERR,
    payload: err,
  };
};

/**
 * get my user info
 */
export const getUserMe = (locateIdMap: ILocateIdMap = {}) => {
  return (dispatch: Dispatch, getState: () => IReduxState) => {
    Api.getUserMe(locateIdMap).then(res => {
      const { success, data } = res.data;
      if (success) {
        const { needCreate, needPwd } = data;
        if (needPwd || needCreate) {
          dispatch(setUserMe(data));
          return;
        }
        dispatch(setIsLogin(true));
        dispatch(setUserMe(data));
        const state = getState();
        if (!state.space.activeId) {
          dispatch(setActiveSpaceId(data.spaceId));
        }
      } else {
        dispatch(setIsLogin(false));
      }
    });
  };
};

/**
 * set my user info
 * @param user 
 */
export const setUserMe = (user: IUserInfo | null) => {
  return {
    type: actions.SET_USER_ME,
    payload: user,
  };
};

/**
 * set state of getting user info
 * @param status 
 */
export const setIsLogin = (status: boolean) => {

  return {
    type: actions.SET_IS_LOGIN,
    payload: status,
  };
};

/**
 * set loading state
 * @param status 
 */
export const setLoading = (status: boolean) => {
  return {
    type: actions.SET_LOADING,
    payload: status,
  };
};

/**
 * set nickname
 * @param nickName 
 */
export const setNickName = (nickName: string) => {
  return {
    type: actions.SET_NICKNAME,
    payload: nickName,
  };
};

/**
 * logout
 */
export const signOut = () => {
  return {
    type: actions.SIGN_OUT,
  };
};

/**
 * set user avatar
 * @param avatar avatar url
 */
export const setUserAvatar = (data: string) => {
  return {
    type: actions.SET_USER_AVATAR,
    payload: data,
  };
};

/**
 * get verify code by email
 * @param email 
 */
export const getEmailCode = (email: string, type = 1) => {
  return (dispatch: Dispatch) => {
    Api.getEmailCode(email, type).then(res => {
      const { code, message } = res.data;
      dispatch(setHomeErr({
        code,
        msg: message,
      }));
    });
  };
};

/**
 * set request status
 * @param status 
 */
export const setReqStatus = (status: boolean) => {
  return {
    type: actions.SET_REQ_STATUS,
    payload: status,
  };
};

/**
 * set http request error message
 * @param info 
 */
export const setHttpErrInfo = (info: IHttpErr | null) => {
  return {
    type: actions.SET_HTTP_ERR_INFO,
    payload: info,
  };
};

/**
 * update password
 */
export const updatePwd = (password: string) => {
  return (dispatch: any) => {
    Api.updatePwd(password).then(res => {
      const { success, code, message: msg } = res.data;
      if (success) {
        dispatch(getUserMe());
      } else {
        dispatch(setHomeErr({
          code,
          msg,
        }));
      }
    });
  };
};

/**
 * unbind account
 */
export const unBindAccount = (type: BindAccount) => {
  return (dispatch: any) => {
    Api.unBindAccount(type).then(res => {
      const { success, code, message: msg } = res.data;
      if (success) {
        dispatch(getUserMe());
      } else {
        dispatch(setHomeErr({
          code,
          msg,
        }));
      }
    });
  };
};

/**
 * update user info
 */
export const updateUserInfo = (info: Partial<IUserInfo>) => {
  return {
    type: actions.UPDATE_USERINFO,
    payload: info,
  };
};
export const updateUserInfoErr = (err: IHttpErr | null) => {
  return {
    type: actions.UPDATE_USERINFO_ERR,
    payload: err,
  };
};

export const addWizardNumber = (wizardId: number) => {
  return {
    type: actions.ADD_WIZARD_NUMBER,
    payload: wizardId,
  };
};

export const setActiveRecordId = (activeRecordId: string | null) => {
  return {
    type: actions.SET_ACTIVE_RECORD_ID,
    payload: activeRecordId
  };
};
