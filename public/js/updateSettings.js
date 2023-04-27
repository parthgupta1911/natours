// eslint-disable
import axios from 'axios';
import { logout } from './login';
export const updateNameEmail = async (form) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
      data: form,
    });
    if (res.data.status === 'success') {
      alert('successfully updated detais!');
      location.assign('/me');
    }
  } catch (err) {
    alert(err.response.data.message);
  }
};

export const updatePassword = async (
  passwordCurrent,
  password,
  passwordConfirm
) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateMyPassword',
      data: {
        passwordCurrent,
        password,
        passwordConfirm,
      },
    });
    if (res.data.status === 'success') {
      alert('successfully updated password! Login again');
    }
  } catch (err) {
    alert(err.response.data.message);
  }
};
